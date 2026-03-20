import "server-only";

import { connectDB } from "@/lib/mongodb";
import {
  buildTripCapabilities,
  canActorAccessTrip,
  type TripActor,
} from "@/features/trips/access";
import { Trip } from "@/lib/models/Trip";
import { Stop } from "@/lib/models/Stop";
import { serializeStops } from "@/features/stops/serialization";
import {
  getStayItemsForTrip,
  getTransportItemsForTrip,
} from "@/features/trip-logistics/service";
import { buildTimelineItems } from "@/features/planner/timeline";
import { getTravelTimesForTrip } from "@/features/travel-times/service";
import {
  applyStopOrder,
  sortStopsBySchedule,
} from "@/features/planner/components/plan-map/utils";
import type { Stop as PlannerStop } from "@/features/planner/components/plan-map/types";

type RawTrip = {
  _id: unknown;
  userId: string;
  ownerType?: "user" | "guest";
  guestId?: string | null;
  name: string;
  description?: string;
  travelDates?: string[];
  centerLat?: number | null;
  centerLng?: number | null;
  centerName?: string;
  editors?: string[];
  status?: string;
  transportMode?: string;
  documents?: Array<{ _id: unknown; name: string; url: string }>;
};

async function getTripPlannerDataForActor(
  tripId: string,
  actor: TripActor,
  from: string,
  to: string,
) {
  await connectDB();

  const trip = (await Trip.findOne({ _id: tripId }).lean()) as RawTrip | null;
  if (!trip || !canActorAccessTrip(trip, actor)) {
    return null;
  }

  const [stopDocs, travelTimes, transportItems, stayItems] = await Promise.all([
    Stop.find({ planId: tripId }).sort({ sequence: 1, createdAt: 1 }).lean(),
    getTravelTimesForTrip(tripId),
    getTransportItemsForTrip(tripId),
    getStayItemsForTrip(tripId),
  ]);

  const stops = serializeStops(stopDocs);
  const sortedStops = applyStopOrder(sortStopsBySchedule(stops));
  const scheduledStops = sortedStops.filter((stop) => stop.isScheduled);
  const unscheduledStops = applyStopOrder(
    sortedStops.filter((stop) => !stop.isScheduled),
  );
  const allOrderedStops = applyStopOrder(scheduledStops);
  const orderedStops = applyStopOrder(
    sortStopsBySchedule(
      stops.filter(
        (stop) =>
          stop.isScheduled &&
          stop.date &&
          (!from || stop.date >= from) &&
          (!to || stop.date <= to),
      ),
    ),
  );
  const expandedStops = orderedStops;
  const allExpandedStops = allOrderedStops;
  const timelineItems = buildTimelineItems(
    expandedStops,
    from,
    to,
    transportItems,
    stayItems,
  );

  return {
    plan: {
      _id: String(trip._id),
      name: trip.name,
      description: trip.description ?? "",
      centerLat: trip.centerLat ?? null,
      centerLng: trip.centerLng ?? null,
      centerName: trip.centerName ?? "",
      transportMode: (trip.transportMode ?? "transit") as
        | "transit"
        | "drive",
    },
    capabilities: buildTripCapabilities(actor),
    isArchived: trip.status === "archived",
    travelDates: trip.travelDates ?? [],
    tripDocs: (trip.documents ?? []).map((document) => ({
      _id: String(document._id),
      name: document.name,
      url: document.url,
    })),
    allStops: sortedStops,
    orderedStops,
    expandedStops,
    allExpandedStops,
    unscheduledStops,
    stayItems,
    timelineItems,
    travelTimes,
  };
}

async function getTripForPlannerActor(tripId: string, actor: TripActor) {
  await connectDB();

  const trip = (await Trip.findOne({ _id: tripId }).lean()) as RawTrip | null;
  if (!trip || !canActorAccessTrip(trip, actor)) {
    return null;
  }

  return trip;
}

function buildOrderedPlannerStops(stopDocs: Parameters<typeof serializeStops>[0]) {
  const stops = serializeStops(stopDocs);
  const sortedStops = applyStopOrder(sortStopsBySchedule(stops));
  const scheduledStops = sortedStops.filter((stop) => stop.isScheduled);
  const unscheduledStops = applyStopOrder(
    sortedStops.filter((stop) => !stop.isScheduled),
  );

  return {
    allStops: sortedStops,
    allOrderedStops: applyStopOrder(scheduledStops),
    unscheduledStops,
  };
}

function buildStopSequence(
  allExpandedStops: PlannerStop[],
  unscheduledStops: PlannerStop[],
  selectedStop: PlannerStop,
  from: string,
  to: string,
) {
  const filteredStops = allExpandedStops.filter(
    (stop) =>
      stop.date &&
      (!from || stop.date >= from) &&
      (!to || stop.date <= to),
  );
  const visibleStops = [...filteredStops, ...unscheduledStops];
  const selectedFromVisible = visibleStops.find(
    (stop) => stop._id === selectedStop._id,
  );

  return selectedFromVisible ? visibleStops : allExpandedStops;
}

async function getPlannerStopDetailForActor(
  tripId: string,
  stopId: string,
  actor: TripActor,
  from: string,
  to: string,
) {
  const trip = await getTripForPlannerActor(tripId, actor);
  if (!trip) {
    return null;
  }

  const rawStops = await Stop.find({ planId: tripId })
    .sort({ sequence: 1, createdAt: 1 })
    .lean();

  const { allOrderedStops, unscheduledStops } = buildOrderedPlannerStops(rawStops);
  const selectedStop =
    allOrderedStops.find((stop) => stop._id === stopId) ??
    unscheduledStops.find((stop) => stop._id === stopId) ??
    null;

  if (!selectedStop) {
    return null;
  }

  const stopSequence = buildStopSequence(
    allOrderedStops,
    unscheduledStops,
    selectedStop,
    from,
    to,
  );
  const selectedIndex = stopSequence.findIndex((stop) => stop._id === stopId);

  return {
    stop: selectedStop,
    relatedStops: selectedStop.placeId
      ? allOrderedStops.filter(
          (stop) => stop.placeId && stop.placeId === selectedStop.placeId,
        )
      : [selectedStop],
    previousStop: selectedIndex > 0 ? stopSequence[selectedIndex - 1] : null,
    nextStop:
      selectedIndex >= 0 && selectedIndex < stopSequence.length - 1
        ? stopSequence[selectedIndex + 1]
        : null,
    tripDocs: (trip.documents ?? []).map((document) => ({
      _id: String(document._id),
      name: document.name,
      url: document.url,
    })),
    isArchived: trip.status === "archived",
    capabilities: buildTripCapabilities(actor),
  };
}

async function getPlannerStayDetailForActor(
  tripId: string,
  stayId: string,
  actor: TripActor,
) {
  const trip = await getTripForPlannerActor(tripId, actor);
  if (!trip) {
    return null;
  }

  const stays = await getStayItemsForTrip(tripId);
  const stay = stays.find((entry) => entry._id === stayId) ?? null;
  if (!stay) {
    return null;
  }

  return {
    stay,
    isArchived: trip.status === "archived",
    capabilities: buildTripCapabilities(actor),
  };
}

export async function getTripPlannerDataForUser(
  tripId: string,
  userId: string,
  from: string,
  to: string,
) {
  return getTripPlannerDataForActor(tripId, { kind: "user", userId }, from, to);
}

export async function getTripPlannerDataForGuest(
  tripId: string,
  guestId: string,
  from: string,
  to: string,
) {
  return getTripPlannerDataForActor(tripId, { kind: "guest", guestId }, from, to);
}

export async function getPlannerStopDetailForUser(
  tripId: string,
  stopId: string,
  userId: string,
  from: string,
  to: string,
) {
  return getPlannerStopDetailForActor(
    tripId,
    stopId,
    { kind: "user", userId },
    from,
    to,
  );
}

export async function getPlannerStopDetailForGuest(
  tripId: string,
  stopId: string,
  guestId: string,
  from: string,
  to: string,
) {
  return getPlannerStopDetailForActor(
    tripId,
    stopId,
    { kind: "guest", guestId },
    from,
    to,
  );
}

export async function getPlannerStayDetailForUser(
  tripId: string,
  stayId: string,
  userId: string,
) {
  return getPlannerStayDetailForActor(tripId, stayId, { kind: "user", userId });
}

export async function getPlannerStayDetailForGuest(
  tripId: string,
  stayId: string,
  guestId: string,
) {
  return getPlannerStayDetailForActor(tripId, stayId, { kind: "guest", guestId });
}

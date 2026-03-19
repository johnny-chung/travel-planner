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
  buildExpandedStops,
  buildOrderedStops,
  expandStops,
  sortStopsBySchedule,
} from "@/components/map/plan-map/utils";

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
  const orderedStops = buildOrderedStops(stops, from, to);
  const expandedStops = buildExpandedStops(orderedStops, from, to);
  const allExpandedStops = expandStops(allOrderedStops);
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

import "server-only";

import { connectDB } from "@/lib/mongodb";
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
} from "@/components/map/plan-map/utils";

type RawTrip = {
  _id: unknown;
  userId: string;
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

export async function getTripPlannerDataForUser(
  tripId: string,
  userId: string,
  from: string,
  to: string,
) {
  await connectDB();

  const trip = (await Trip.findOne({ _id: tripId }).lean()) as RawTrip | null;
  if (
    !trip ||
    (trip.userId !== userId && !(trip.editors ?? []).includes(userId))
  ) {
    return null;
  }

  const [stopDocs, travelTimes, transportItems, stayItems] = await Promise.all([
    Stop.find({ planId: tripId })
      .sort({ "arrivals.0.date": 1, "arrivals.0.time": 1 })
      .lean(),
    getTravelTimesForTrip(tripId),
    getTransportItemsForTrip(tripId),
    getStayItemsForTrip(tripId),
  ]);

  const stops = serializeStops(stopDocs);
  const allOrderedStops = applyStopOrder(stops);
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
    isArchived: trip.status === "archived",
    travelDates: trip.travelDates ?? [],
    tripDocs: (trip.documents ?? []).map((document) => ({
      _id: String(document._id),
      name: document.name,
      url: document.url,
    })),
    orderedStops,
    expandedStops,
    allExpandedStops,
    stayItems,
    timelineItems,
    travelTimes,
  };
}

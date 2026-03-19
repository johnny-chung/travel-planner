import "server-only";

import { connectDB } from "@/lib/mongodb";
import { TravelTime } from "@/lib/models/TravelTime";
import { ApiUsage } from "@/lib/models/ApiUsage";
import { UserMonthlyUsage } from "@/lib/models/UserMonthlyUsage";
import { User } from "@/lib/models/User";
import { Stop } from "@/lib/models/Stop";
import { Trip } from "@/lib/models/Trip";
import {
  getStayItemsForTrip,
  getTransportItemsForTrip,
} from "@/features/trip-logistics/service";
import { buildRouteSegments, buildTimelineItems } from "@/features/planner/timeline";
import { calculateWithFallback, type TravelMode } from "@/lib/routes-api";
import type { TravelTimeEntry } from "@/components/map/plan-map/types";

export class TravelTimeServiceError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type TripAccessRecord = {
  userId: string;
  editors?: string[];
  transportMode?: string;
};

type StopRecord = {
  _id: unknown;
  lat: number;
  lng: number;
  arrivals?: Array<{ date: string; time: string }>;
};

type TravelTimeRecord = Record<string, unknown>;

function getYearMonth() {
  return new Date().toISOString().slice(0, 7);
}

function canAccessTrip(trip: TripAccessRecord, userId: string) {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

function serializeTravelTime(travelTime: TravelTimeRecord): TravelTimeEntry {
  return {
    _id: String(travelTime._id ?? ""),
    fromStopId: String(travelTime.fromStopId ?? ""),
    toStopId: String(travelTime.toStopId ?? ""),
    mode: (travelTime.mode ?? "TRANSIT") as TravelTimeEntry["mode"],
    durationMinutes: Number(travelTime.durationMinutes ?? 0),
    distanceMeters:
      travelTime.distanceMeters === null || travelTime.distanceMeters === undefined
        ? null
        : Number(travelTime.distanceMeters),
    summary:
      typeof travelTime.summary === "string" ? travelTime.summary : undefined,
    details: Array.isArray(travelTime.details)
      ? (travelTime.details as TravelTimeEntry["details"])
      : undefined,
  };
}

async function getAccessibleTrip(tripId: string, userId: string) {
  const trip = (await Trip.findOne({ _id: tripId }).lean()) as
    | TripAccessRecord
    | null;
  if (!trip || !canAccessTrip(trip, userId)) {
    throw new TravelTimeServiceError("NOT_FOUND", "Trip not found");
  }
  return trip;
}

async function assertUsageAllowed(userId: string) {
  const yearMonth = getYearMonth();

  const apiUsage = (await ApiUsage.findOne({
    yearMonth,
    apiType: "routes",
  }).lean()) as { count?: number } | null;
  if ((apiUsage?.count ?? 0) >= 10000) {
    throw new TravelTimeServiceError(
      "GLOBAL_LIMIT",
      "Monthly API limit reached",
    );
  }

  const user = (await User.findOne({ userId }).lean()) as
    | { membershipStatus?: string }
    | null;
  const isPro = user?.membershipStatus === "pro";
  const userUsage = (await UserMonthlyUsage.findOne({
    userId,
    yearMonth,
  }).lean()) as { commuteCount?: number } | null;
  const commuteLimit = isPro ? 100 : 10;
  if ((userUsage?.commuteCount ?? 0) >= commuteLimit) {
    throw new TravelTimeServiceError(
      "USER_LIMIT",
      "Monthly calculation limit reached. Upgrade to Pro for more.",
    );
  }

  return { yearMonth };
}

async function incrementApiUsage(yearMonth: string, userId: string, count = 1) {
  await ApiUsage.findOneAndUpdate(
    { yearMonth, apiType: "routes" },
    { $inc: { count } },
    { upsert: true },
  );

  await UserMonthlyUsage.findOneAndUpdate(
    { userId, yearMonth },
    { $inc: { commuteCount: 1 } },
    { upsert: true },
  );
}

export async function getTravelTimesForTrip(
  planId: string,
): Promise<TravelTimeEntry[]> {
  await connectDB();
  const times = (await TravelTime.find({ planId })
    .sort({ calculatedAt: -1 })
    .lean()) as TravelTimeRecord[];
  const uniqueTimes = new Map<string, TravelTimeRecord>();
  for (const time of times) {
    const key = `${String(time.fromStopId)}:${String(time.toStopId)}`;
    if (!uniqueTimes.has(key)) {
      uniqueTimes.set(key, time);
    }
  }
  return [...uniqueTimes.values()].map(serializeTravelTime);
}

export async function calculateTravelTimeForUser(input: {
  userId: string;
  planId: string;
  fromNodeId: string;
  toNodeId: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  toDate: string;
  toTime: string;
  mode: TravelMode;
}): Promise<TravelTimeEntry> {
  await connectDB();
  await getAccessibleTrip(input.planId, input.userId);
  const { yearMonth } = await assertUsageAllowed(input.userId);

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    "";

  const result = await calculateWithFallback(
    input.fromLat,
    input.fromLng,
    input.toLat,
    input.toLng,
    input.mode,
    input.toDate,
    input.toTime,
    apiKey,
  );

  if (!result) {
    throw new TravelTimeServiceError(
      "NO_ROUTE",
      "No route found between these stops",
    );
  }

  await TravelTime.deleteMany({
    fromStopId: input.fromNodeId,
    toStopId: input.toNodeId,
  });

  const travelTime = await TravelTime.create({
    planId: input.planId,
    fromStopId: input.fromNodeId,
    toStopId: input.toNodeId,
    mode: result.mode,
    durationMinutes: result.durationMinutes,
    distanceMeters: result.distanceMeters,
    summary: result.summary,
    details: result.details,
    calculatedAt: new Date(),
  });

  await incrementApiUsage(yearMonth, input.userId);
  return serializeTravelTime(travelTime.toObject());
}

export async function calculateAllTravelTimesForUser(
  planId: string,
  userId: string,
): Promise<TravelTimeEntry[]> {
  await connectDB();
  const trip = await getAccessibleTrip(planId, userId);
  const { yearMonth } = await assertUsageAllowed(userId);

  const rawMode = trip.transportMode ?? "transit";
  const requestedMode = (
    rawMode.toUpperCase() === "DRIVE"
      ? "DRIVE"
      : rawMode.toUpperCase() === "WALK"
        ? "WALK"
        : "TRANSIT"
  ) as TravelMode;

  const [stops, stayItems, transportItems] = await Promise.all([
    Stop.find({ planId })
      .sort({ "arrivals.0.date": 1, "arrivals.0.time": 1 })
      .lean() as Promise<StopRecord[]>,
    getStayItemsForTrip(planId),
    getTransportItemsForTrip(planId),
  ]);

  const timelineStops = stops.flatMap((stop) =>
    (stop.arrivals ?? []).map((arrival, arrivalIndex) => ({
      _id: String(stop._id),
      planId,
      name: "",
      address: "",
      lat: stop.lat,
      lng: stop.lng,
      placeId: "",
      date: arrival.date,
      time: arrival.time,
      notes: "",
      openingHours: [],
      phone: "",
      website: "",
      thumbnail: "",
      order: 0,
      linkedDocIds: [],
      arrivals: stop.arrivals ?? [],
      _arrivalIndex: arrivalIndex,
      sourceType: "manual" as const,
      sourceId: "",
      sourceLabel: "",
      displayTime: true,
      editable: true,
    })),
  );

  const routeSegments = buildRouteSegments(
    buildTimelineItems(timelineStops, "", "", transportItems, stayItems),
  );

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    "";

  let calculatedCount = 0;
  let pendingPairCount = 0;
  for (const segment of routeSegments) {
    const fromNode = segment.from;
    const toNode = segment.to;
    const existing = await TravelTime.findOne({
      fromStopId: fromNode.id,
      toStopId: toNode.id,
    }).lean();
    if (existing) {
      continue;
    }
    pendingPairCount += 1;

    const result = await calculateWithFallback(
      fromNode.lat,
      fromNode.lng,
      toNode.lat,
      toNode.lng,
      requestedMode,
      toNode.date,
      toNode.time,
      apiKey,
    );

    if (!result) {
      continue;
    }

    await TravelTime.deleteMany({
      fromStopId: fromNode.id,
      toStopId: toNode.id,
    });
    await TravelTime.create({
      planId,
      fromStopId: fromNode.id,
      toStopId: toNode.id,
      mode: result.mode,
      durationMinutes: result.durationMinutes,
      distanceMeters: result.distanceMeters,
      summary: result.summary,
      details: result.details,
      calculatedAt: new Date(),
    });
    calculatedCount += 1;
  }

  if (calculatedCount > 0) {
    await incrementApiUsage(yearMonth, userId);
  }

  if (pendingPairCount > 0 && calculatedCount === 0) {
    throw new TravelTimeServiceError(
      "NO_ROUTE",
      "Failed to calculate travel times for the current stop sequence",
    );
  }

  return getTravelTimesForTrip(planId);
}

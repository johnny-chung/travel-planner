import "server-only";

import { connectDB } from "@/lib/mongodb";
import { buildEndpointPrefixPattern } from "@/features/planner/timeline";
import {
  getTransportItemsForTrip,
  isArrivalWithinTransportRange,
} from "@/features/trip-logistics/service";
import { Stop } from "@/lib/models/Stop";
import { TravelTime } from "@/lib/models/TravelTime";
import { Trip } from "@/lib/models/Trip";
import { syncTripTravelDates } from "@/features/trips/travel-dates";
import { serializeStop } from "@/features/stops/serialization";
import type { StopArrival } from "@/types/stop";

export class StopServiceError extends Error {
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
  status?: string;
};

type CreateStopInput = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  placeId?: string;
  notes?: string;
  openingHours?: string[];
  phone?: string;
  website?: string;
  thumbnail?: string;
  linkedDocIds?: string[];
  arrivals: StopArrival[];
};

type UpdateStopInput = {
  notes?: string;
  linkedDocIds?: string[];
  arrivals?: StopArrival[];
};

function canAccessTrip(trip: TripAccessRecord, userId: string) {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

async function getTripForUser(
  tripId: string,
  userId: string,
  options?: { allowArchived?: boolean },
) {
  const trip = (await Trip.findOne({ _id: tripId }).lean()) as
    | TripAccessRecord
    | null;

  if (!trip || !canAccessTrip(trip, userId)) {
    throw new StopServiceError("NOT_FOUND", "Trip not found");
  }

  if (!options?.allowArchived && trip.status === "archived") {
    throw new StopServiceError("ARCHIVED", "Trip is archived");
  }

  return trip;
}

function normalizeArrivals(arrivals: StopArrival[]) {
  const normalized = arrivals
    .filter(
      (arrival) =>
        typeof arrival.date === "string" &&
        arrival.date.trim() &&
        typeof arrival.time === "string" &&
        arrival.time.trim(),
    )
    .map((arrival) => ({
      date: arrival.date.trim(),
      time: arrival.time.trim(),
    }))
    .sort((left, right) => {
      if (left.date !== right.date) {
        return left.date.localeCompare(right.date);
      }
      return left.time.localeCompare(right.time);
    });

  if (normalized.length === 0) {
    throw new StopServiceError("INVALID", "A stop needs at least one arrival");
  }

  return normalized;
}

function normalizeStringArray(value: string[] | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function assertArrivalsOutsideTransportRanges(
  tripId: string,
  arrivals: StopArrival[],
) {
  const transports = await getTransportItemsForTrip(tripId);

  for (const arrival of arrivals) {
    const overlappingTransport = isArrivalWithinTransportRange(arrival, transports);
    if (overlappingTransport) {
      throw new StopServiceError(
        "TRANSPORT_CONFLICT",
        `This stop overlaps with ${overlappingTransport.title} (${overlappingTransport.departureDate} ${overlappingTransport.departureTime} to ${overlappingTransport.arrivalDate} ${overlappingTransport.arrivalTime})`,
      );
    }
  }
}

export async function createStopForUser(
  tripId: string,
  userId: string,
  input: CreateStopInput,
) {
  await connectDB();
  await getTripForUser(tripId, userId);
  const normalizedArrivals = normalizeArrivals(input.arrivals);
  await assertArrivalsOutsideTransportRanges(tripId, normalizedArrivals);

  const stop = await Stop.create({
    planId: tripId,
    userId,
    name: input.name,
    address: input.address ?? "",
    lat: input.lat,
    lng: input.lng,
    placeId: input.placeId ?? "",
    notes: input.notes ?? "",
    openingHours: normalizeStringArray(input.openingHours),
    phone: input.phone ?? "",
    website: input.website ?? "",
    thumbnail: input.thumbnail ?? "",
    linkedDocIds: normalizeStringArray(input.linkedDocIds),
    arrivals: normalizedArrivals,
  });

  await syncTripTravelDates(tripId);
  return serializeStop(stop.toObject(), 1);
}

export async function updateStopForUser(
  tripId: string,
  stopId: string,
  userId: string,
  input: UpdateStopInput,
) {
  await connectDB();
  await getTripForUser(tripId, userId);
  const existingStop = await Stop.findOne({ _id: stopId, planId: tripId }).lean();
  if (!existingStop) {
    throw new StopServiceError("NOT_FOUND", "Stop not found");
  }

  const update: Record<string, unknown> = {};
  if (input.notes !== undefined) {
    update.notes = input.notes;
  }
  if (input.linkedDocIds !== undefined) {
    update.linkedDocIds = normalizeStringArray(input.linkedDocIds);
  }
  if (input.arrivals !== undefined) {
    const normalizedArrivals = normalizeArrivals(input.arrivals);
    await assertArrivalsOutsideTransportRanges(tripId, normalizedArrivals);
    update.arrivals = normalizedArrivals;
    const endpointPattern = buildEndpointPrefixPattern(stopId);
    await TravelTime.deleteMany({
      $or: [{ fromStopId: endpointPattern }, { toStopId: endpointPattern }],
    });
  }

  const stop = await Stop.findOneAndUpdate({ _id: stopId, planId: tripId }, update, {
    new: true,
  }).lean();

  if (!stop) {
    throw new StopServiceError("NOT_FOUND", "Stop not found");
  }

  await syncTripTravelDates(tripId);
  return serializeStop(stop, 1);
}

export async function deleteStopForUser(
  tripId: string,
  stopId: string,
  userId: string,
) {
  await connectDB();
  await getTripForUser(tripId, userId);

  await Stop.findOneAndDelete({ _id: stopId, planId: tripId });
  const endpointPattern = buildEndpointPrefixPattern(stopId);
  await TravelTime.deleteMany({
    $or: [{ fromStopId: endpointPattern }, { toStopId: endpointPattern }],
  });
  await syncTripTravelDates(tripId);
}

export async function addArrivalToStopForUser(
  tripId: string,
  stopId: string,
  userId: string,
  arrival: StopArrival,
) {
  await connectDB();
  await getTripForUser(tripId, userId);

  const stop = (await Stop.findOne({ _id: stopId, planId: tripId }).lean()) as
    | { arrivals?: StopArrival[] }
    | null;
  if (!stop) {
    throw new StopServiceError("NOT_FOUND", "Stop not found");
  }

  const arrivals = [...(stop.arrivals ?? []), arrival];
  return updateStopForUser(tripId, stopId, userId, { arrivals });
}

export async function removeArrivalFromStopForUser(
  tripId: string,
  stopId: string,
  userId: string,
  arrivalIndex: number,
) {
  await connectDB();
  await getTripForUser(tripId, userId);

  const stop = (await Stop.findOne({ _id: stopId, planId: tripId }).lean()) as
    | { arrivals?: StopArrival[] }
    | null;
  if (!stop) {
    throw new StopServiceError("NOT_FOUND", "Stop not found");
  }

  const arrivals = stop.arrivals ?? [];
  if (arrivals.length <= 1) {
    throw new StopServiceError("INVALID", "Cannot remove the only arrival");
  }

  if (arrivalIndex < 0 || arrivalIndex >= arrivals.length) {
    throw new StopServiceError("INVALID", "Arrival not found");
  }

  const nextArrivals = arrivals.filter((_, index) => index !== arrivalIndex);
  return updateStopForUser(tripId, stopId, userId, { arrivals: nextArrivals });
}

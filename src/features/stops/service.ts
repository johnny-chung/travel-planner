import "server-only";

import { connectDB } from "@/lib/mongodb";
import { getAppLimits } from "@/features/settings/service";
import {
  getTransportItemsForTrip,
  isArrivalWithinTransportRange,
} from "@/features/trip-logistics/service";
import {
  canActorAccessTrip,
  type TripActor,
} from "@/features/trips/access";
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
  userId?: string;
  ownerType?: "user" | "guest";
  guestId?: string | null;
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
  arrivals?: StopArrival[];
};

type UpdateStopInput = {
  notes?: string;
  linkedDocIds?: string[];
  arrivals?: StopArrival[];
  sequence?: number;
};

type AppliedStopSchedule = {
  stopId: string;
  date: string;
  time: string;
  sequence: number;
};

async function getTripForActor(
  tripId: string,
  actor: TripActor,
  options?: { allowArchived?: boolean },
) {
  const trip = (await Trip.findOne({ _id: tripId }).lean()) as
    | TripAccessRecord
    | null;

  if (!trip || !canActorAccessTrip(trip, actor)) {
    throw new StopServiceError("NOT_FOUND", "Trip not found");
  }

  if (!options?.allowArchived && trip.status === "archived") {
    throw new StopServiceError("ARCHIVED", "Trip is archived");
  }

  return trip;
}

async function assertGuestStopLimit(actor: TripActor, tripId: string, nextStops = 1) {
  if (actor.kind !== "guest") {
    return;
  }

  const limits = await getAppLimits();
  const currentStops = await Stop.countDocuments({ planId: tripId });
  if (currentStops + nextStops > limits.guestStops) {
    throw new StopServiceError(
      "LIMIT_REACHED",
      `Guest trial includes up to ${limits.guestStops} stop${limits.guestStops === 1 ? "" : "s"}. Sign up to keep planning.`,
    );
  }
}

function normalizeArrivals(arrivals: StopArrival[] | undefined) {
  if (!Array.isArray(arrivals) || arrivals.length === 0) {
    return [];
  }

  const normalized = arrivals
    .map((arrival) => ({
      date: typeof arrival.date === "string" ? arrival.date.trim() : "",
      time: typeof arrival.time === "string" ? arrival.time.trim() : "",
    }))
    .filter((arrival) => {
      if (!arrival.date) {
        return false;
      }

      return true;
    })
    .map((arrival) => ({
      date: arrival.date,
      time: arrival.time,
    }))
    .sort((left, right) => {
      if (left.date !== right.date) {
        return left.date.localeCompare(right.date);
      }
      if (!left.time && !right.time) {
        return 0;
      }
      if (!left.time) {
        return 1;
      }
      if (!right.time) {
        return -1;
      }
      return left.time.localeCompare(right.time);
    });

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

async function getNextStopSequence(tripId: string) {
  const lastStop = (await Stop.findOne({ planId: tripId })
    .sort({ sequence: -1 })
    .select("sequence")
    .lean()) as { sequence?: number } | null;

  return (lastStop?.sequence ?? 0) + 1;
}

function buildStopEndpointPattern(stopId: string) {
  const escaped = stopId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?::|$)`);
}

export async function createStopForUser(
  tripId: string,
  userId: string,
  input: CreateStopInput,
) {
  return createStopForActor(tripId, { kind: "user", userId }, input);
}

export async function createStopForGuest(
  tripId: string,
  guestId: string,
  input: CreateStopInput,
) {
  return createStopForActor(tripId, { kind: "guest", guestId }, input);
}

async function createStopForActor(
  tripId: string,
  actor: TripActor,
  input: CreateStopInput,
) {
  await connectDB();
  await getTripForActor(tripId, actor);
  await assertGuestStopLimit(actor, tripId);
  const normalizedArrivals = normalizeArrivals(input.arrivals);
  await assertArrivalsOutsideTransportRanges(tripId, normalizedArrivals);
  const sequence = await getNextStopSequence(tripId);

  const stop = await Stop.create({
    planId: tripId,
    userId: actor.kind === "user" ? actor.userId : `guest:${actor.guestId}`,
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
    sequence,
    displayTime: normalizedArrivals[0]?.time ? true : false,
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
  return updateStopForActor(tripId, stopId, { kind: "user", userId }, input);
}

export async function updateStopForGuest(
  tripId: string,
  stopId: string,
  guestId: string,
  input: UpdateStopInput,
) {
  return updateStopForActor(tripId, stopId, { kind: "guest", guestId }, input);
}

async function updateStopForActor(
  tripId: string,
  stopId: string,
  actor: TripActor,
  input: UpdateStopInput,
) {
  await connectDB();
  await getTripForActor(tripId, actor);
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
    update.displayTime = normalizedArrivals[0]?.time ? true : false;
    const endpointPattern = buildStopEndpointPattern(stopId);
    await TravelTime.deleteMany({
      $or: [{ fromStopId: endpointPattern }, { toStopId: endpointPattern }],
    });
  }
  if (input.sequence !== undefined && Number.isFinite(input.sequence)) {
    update.sequence = input.sequence;
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
  return deleteStopForActor(tripId, stopId, { kind: "user", userId });
}

export async function deleteStopForGuest(
  tripId: string,
  stopId: string,
  guestId: string,
) {
  return deleteStopForActor(tripId, stopId, { kind: "guest", guestId });
}

async function deleteStopForActor(
  tripId: string,
  stopId: string,
  actor: TripActor,
) {
  await connectDB();
  await getTripForActor(tripId, actor);

  await Stop.findOneAndDelete({ _id: stopId, planId: tripId });
  const endpointPattern = buildStopEndpointPattern(stopId);
  await TravelTime.deleteMany({
    $or: [{ fromStopId: endpointPattern }, { toStopId: endpointPattern }],
  });
  await syncTripTravelDates(tripId);
}

async function reorderStopsForActor(
  tripId: string,
  actor: TripActor,
  orderedStopIds: string[],
) {
  await connectDB();
  await getTripForActor(tripId, actor);

  const uniqueStopIds = [...new Set(orderedStopIds.filter(Boolean))];
  if (uniqueStopIds.length === 0) {
    throw new StopServiceError("INVALID", "No stops to reorder");
  }

  const stops = (await Stop.find({
    _id: { $in: uniqueStopIds },
    planId: tripId,
  })
    .select("_id sequence")
    .lean()) as Array<{ _id: unknown; sequence?: number }>;

  if (stops.length !== uniqueStopIds.length) {
    throw new StopServiceError("NOT_FOUND", "Some stops were not found");
  }

  const sequenceById = new Map(
    stops.map((stop) => [String(stop._id), stop.sequence ?? 0]),
  );
  const sortedSequences = [...sequenceById.values()].sort((left, right) => left - right);

  await Promise.all(
    uniqueStopIds.map((stopId, index) =>
      Stop.updateOne(
        { _id: stopId, planId: tripId },
        { $set: { sequence: sortedSequences[index] ?? index + 1 } },
      ),
    ),
  );
}

export async function reorderStopsForUser(
  tripId: string,
  userId: string,
  orderedStopIds: string[],
) {
  return reorderStopsForActor(tripId, { kind: "user", userId }, orderedStopIds);
}

export async function reorderStopsForGuest(
  tripId: string,
  guestId: string,
  orderedStopIds: string[],
) {
  return reorderStopsForActor(tripId, { kind: "guest", guestId }, orderedStopIds);
}

async function applyStopSchedulesForActor(
  tripId: string,
  actor: TripActor,
  schedules: AppliedStopSchedule[],
) {
  await connectDB();
  await getTripForActor(tripId, actor);

  const uniqueSchedules = schedules.filter(
    (schedule, index, list) =>
      schedule.stopId &&
      list.findIndex((entry) => entry.stopId === schedule.stopId) === index,
  );

  if (uniqueSchedules.length === 0) {
    throw new StopServiceError("INVALID", "No stop schedule updates provided");
  }

  const stops = (await Stop.find({
    _id: { $in: uniqueSchedules.map((schedule) => schedule.stopId) },
    planId: tripId,
  })
    .select("_id arrivals")
    .lean()) as Array<{ _id: unknown; arrivals?: StopArrival[] }>;

  if (stops.length !== uniqueSchedules.length) {
    throw new StopServiceError("NOT_FOUND", "Some stops were not found");
  }

  for (const stop of stops) {
    if ((stop.arrivals ?? []).length > 1) {
      throw new StopServiceError(
        "INVALID",
        "Stops with multiple arrivals cannot be reordered yet",
      );
    }
  }

  for (const schedule of uniqueSchedules) {
    const arrivals = schedule.date
      ? [{ date: schedule.date, time: schedule.time }]
      : [];
    await assertArrivalsOutsideTransportRanges(tripId, arrivals);

    await Stop.updateOne(
      { _id: schedule.stopId, planId: tripId },
      {
        $set: {
          arrivals,
          displayTime: Boolean(schedule.date && schedule.time),
          sequence: schedule.sequence,
        },
      },
    );
  }

  const endpointPatterns = uniqueSchedules.map((schedule) =>
    buildStopEndpointPattern(schedule.stopId),
  );
  await TravelTime.deleteMany({
    $or: [
      { fromStopId: { $in: endpointPatterns } },
      { toStopId: { $in: endpointPatterns } },
    ],
  });

  await syncTripTravelDates(tripId);
}

export async function applyStopSchedulesForUser(
  tripId: string,
  userId: string,
  schedules: AppliedStopSchedule[],
) {
  return applyStopSchedulesForActor(tripId, { kind: "user", userId }, schedules);
}

export async function applyStopSchedulesForGuest(
  tripId: string,
  guestId: string,
  schedules: AppliedStopSchedule[],
) {
  return applyStopSchedulesForActor(tripId, { kind: "guest", guestId }, schedules);
}

export async function addArrivalToStopForUser(
  tripId: string,
  stopId: string,
  userId: string,
  arrival: StopArrival,
) {
  return addArrivalToStopForActor(tripId, stopId, { kind: "user", userId }, arrival);
}

export async function addArrivalToStopForGuest(
  tripId: string,
  stopId: string,
  guestId: string,
  arrival: StopArrival,
) {
  return addArrivalToStopForActor(tripId, stopId, { kind: "guest", guestId }, arrival);
}

async function addArrivalToStopForActor(
  tripId: string,
  stopId: string,
  actor: TripActor,
  arrival: StopArrival,
) {
  await connectDB();
  await getTripForActor(tripId, actor);

  const stop = (await Stop.findOne({ _id: stopId, planId: tripId }).lean()) as
    | { arrivals?: StopArrival[] }
    | null;
  if (!stop) {
    throw new StopServiceError("NOT_FOUND", "Stop not found");
  }

  const arrivals = [...(stop.arrivals ?? []), arrival];
  return updateStopForActor(tripId, stopId, actor, { arrivals });
}

export async function removeArrivalFromStopForUser(
  tripId: string,
  stopId: string,
  userId: string,
  arrivalIndex: number,
) {
  return removeArrivalFromStopForActor(
    tripId,
    stopId,
    { kind: "user", userId },
    arrivalIndex,
  );
}

export async function removeArrivalFromStopForGuest(
  tripId: string,
  stopId: string,
  guestId: string,
  arrivalIndex: number,
) {
  return removeArrivalFromStopForActor(
    tripId,
    stopId,
    { kind: "guest", guestId },
    arrivalIndex,
  );
}

async function removeArrivalFromStopForActor(
  tripId: string,
  stopId: string,
  actor: TripActor,
  arrivalIndex: number,
) {
  await connectDB();
  await getTripForActor(tripId, actor);

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
  return updateStopForActor(tripId, stopId, actor, { arrivals: nextArrivals });
}

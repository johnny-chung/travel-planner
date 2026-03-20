import "server-only";

import { connectDB } from "@/lib/mongodb";
import { getAppLimits } from "@/features/settings/service";
import {
  getTransportItemsForTrip,
  isVisitWithinTransportRange,
} from "@/features/trip-logistics/service";
import {
  canActorAccessTrip,
  type TripActor,
} from "@/features/trips/access";
import { Stop } from "@/lib/models/Stop";
import { TravelTime } from "@/lib/models/TravelTime";
import { Trip } from "@/lib/models/Trip";
import { syncTripTravelDates } from "@/features/trips/travel-dates";
import { serializeStop, serializeStops } from "@/features/stops/serialization";
import type { TripStop } from "@/types/stop";
import { orderStopsForDay } from "@/features/planner/components/plan-map/utils";

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
  date?: string;
  time?: string;
};

type UpdateStopInput = {
  notes?: string;
  linkedDocIds?: string[];
  date?: string;
  time?: string;
};

type DuplicateStopInput = {
  date?: string;
  time?: string;
};

type AppliedStopSchedule = {
  stopId: string;
  date: string;
  time: string;
  sequence: number;
};

type RawStopRecord = {
  _id: unknown;
  planId?: unknown;
  name?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
  placeId?: unknown;
  date?: unknown;
  time?: unknown;
  status?: unknown;
  sequence?: unknown;
  notes?: unknown;
  openingHours?: unknown;
  phone?: unknown;
  website?: unknown;
  thumbnail?: unknown;
  linkedDocIds?: unknown;
  sourceType?: unknown;
  sourceId?: unknown;
  sourceLabel?: unknown;
  displayTime?: unknown;
  editable?: unknown;
};

function normalizeStringArray(value: string[] | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeSchedule(date: string | undefined, time: string | undefined) {
  const nextDate = date?.trim() ?? "";
  const nextTime = time?.trim() ?? "";

  if (!nextDate) {
    return {
      status: "unscheduled" as const,
      date: "",
      time: "",
      displayTime: false,
    };
  }

  return {
    status: "scheduled" as const,
    date: nextDate,
    time: nextTime,
    displayTime: Boolean(nextTime),
  };
}

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

async function getSerializedStopsForTrip(tripId: string) {
  const rawStops = (await Stop.find({ planId: tripId })
    .sort({ sequence: 1, createdAt: 1 })
    .lean()) as RawStopRecord[];

  return serializeStops(rawStops);
}

function buildOrderedTripStops(stops: TripStop[]) {
  const scheduled = stops.filter((stop) => stop.isScheduled && stop.date);
  const unscheduled = stops
    .filter((stop) => !stop.isScheduled || !stop.date)
    .sort((left, right) => left.sequence - right.sequence || left._id.localeCompare(right._id));

  const dates = [...new Set(scheduled.map((stop) => stop.date))].sort();
  return [
    ...dates.flatMap((date) =>
      orderStopsForDay(scheduled.filter((stop) => stop.date === date)),
    ),
    ...unscheduled,
  ];
}

async function resequenceTripStops(tripId: string) {
  const serializedStops = await getSerializedStopsForTrip(tripId);
  const orderedStops = buildOrderedTripStops(serializedStops);

  await Promise.all(
    orderedStops.map((stop, index) =>
      Stop.updateOne(
        { _id: stop._id, planId: tripId },
        { $set: { sequence: index + 1 } },
      ),
    ),
  );
}

async function assertStopOutsideTransportRanges(
  tripId: string,
  stop: { date: string; time: string; displayTime: boolean; isScheduled?: boolean },
) {
  if (!stop.date || !stop.time || !stop.displayTime) {
    return;
  }

  const transports = await getTransportItemsForTrip(tripId);
  const overlappingTransport = isVisitWithinTransportRange(
    { date: stop.date, time: stop.time },
    transports,
  );

  if (overlappingTransport) {
    throw new StopServiceError(
      "TRANSPORT_CONFLICT",
      `This stop overlaps with ${overlappingTransport.title} (${overlappingTransport.departureDate} ${overlappingTransport.departureTime} to ${overlappingTransport.arrivalDate} ${overlappingTransport.arrivalTime})`,
    );
  }
}

async function getNextStopSequence(tripId: string) {
  const lastStop = (await Stop.findOne({ planId: tripId })
    .sort({ sequence: -1 })
    .select("sequence")
    .lean()) as { sequence?: number } | null;

  return (lastStop?.sequence ?? 0) + 1;
}

async function getInsertSequenceForScheduledUntimedStop(tripId: string, date: string) {
  const firstStop = (await Stop.findOne({
    planId: tripId,
    status: "scheduled",
    date,
  })
    .sort({ sequence: 1, createdAt: 1 })
    .select("sequence")
    .lean()) as { sequence?: number } | null;

  if (typeof firstStop?.sequence === "number" && Number.isFinite(firstStop.sequence)) {
    return firstStop.sequence + 0.5;
  }

  return getNextStopSequence(tripId);
}

function buildStopEndpointPattern(stopId: string) {
  const escaped = stopId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?::|$)`);
}

async function clearTravelTimesForStops(stopIds: string[]) {
  const uniqueStopIds = [...new Set(stopIds.filter(Boolean))];
  if (uniqueStopIds.length === 0) {
    return;
  }

  const endpointPatterns = uniqueStopIds.map((stopId) => buildStopEndpointPattern(stopId));
  await TravelTime.deleteMany({
    $or: [{ fromStopId: { $in: endpointPatterns } }, { toStopId: { $in: endpointPatterns } }],
  });
}

function buildStopUpdateSchedule(input: { date?: string; time?: string }) {
  return normalizeSchedule(input.date, input.time);
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

  const schedule = buildStopUpdateSchedule(input);
  await assertStopOutsideTransportRanges(tripId, {
    ...schedule,
    isScheduled: schedule.status === "scheduled",
  });

  const sequence =
    schedule.status === "scheduled" && !schedule.time
      ? await getInsertSequenceForScheduledUntimedStop(tripId, schedule.date)
      : await getNextStopSequence(tripId);

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
    status: schedule.status,
    date: schedule.date,
    time: schedule.time,
    displayTime: schedule.displayTime,
    sequence,
  });

  await resequenceTripStops(tripId);
  await syncTripTravelDates(tripId);
  const refreshedStop = await Stop.findById(stop._id).lean();
  return serializeStop(refreshedStop ?? stop.toObject(), 1);
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

  const existingStop = (await Stop.findOne({ _id: stopId, planId: tripId }).lean()) as RawStopRecord | null;
  if (!existingStop) {
    throw new StopServiceError("NOT_FOUND", "Stop not found");
  }

  const nextSchedule = buildStopUpdateSchedule({
    date: input.date ?? (typeof existingStop.date === "string" ? existingStop.date : ""),
    time: input.time ?? (typeof existingStop.time === "string" ? existingStop.time : ""),
  });

  await assertStopOutsideTransportRanges(tripId, {
    ...nextSchedule,
    isScheduled: nextSchedule.status === "scheduled",
  });

  const update: Record<string, unknown> = {
    status: nextSchedule.status,
    date: nextSchedule.date,
    time: nextSchedule.time,
    displayTime: nextSchedule.displayTime,
  };

  if (input.notes !== undefined) {
    update.notes = input.notes;
  }

  if (input.linkedDocIds !== undefined) {
    update.linkedDocIds = normalizeStringArray(input.linkedDocIds);
  }

  const existingWasScheduled =
    existingStop.status === "scheduled" && typeof existingStop.date === "string" && existingStop.date;
  const movedToDifferentBucket =
    !existingWasScheduled ||
    nextSchedule.date !== (typeof existingStop.date === "string" ? existingStop.date : "");

  if (nextSchedule.status === "scheduled" && !nextSchedule.time && movedToDifferentBucket) {
    update.sequence = await getInsertSequenceForScheduledUntimedStop(tripId, nextSchedule.date);
  }

  const stop = await Stop.findOneAndUpdate({ _id: stopId, planId: tripId }, update, {
    new: true,
  }).lean();

  if (!stop) {
    throw new StopServiceError("NOT_FOUND", "Stop not found");
  }

  await clearTravelTimesForStops([stopId]);
  await resequenceTripStops(tripId);
  await syncTripTravelDates(tripId);
  const refreshedStop = await Stop.findById(stopId).lean();
  return serializeStop(refreshedStop ?? stop, 1);
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
  await clearTravelTimesForStops([stopId]);
  await resequenceTripStops(tripId);
  await syncTripTravelDates(tripId);
}

export async function duplicateStopForUser(
  tripId: string,
  stopId: string,
  userId: string,
  input: DuplicateStopInput,
) {
  return duplicateStopForActor(tripId, stopId, { kind: "user", userId }, input);
}

export async function duplicateStopForGuest(
  tripId: string,
  stopId: string,
  guestId: string,
  input: DuplicateStopInput,
) {
  return duplicateStopForActor(tripId, stopId, { kind: "guest", guestId }, input);
}

async function duplicateStopForActor(
  tripId: string,
  stopId: string,
  actor: TripActor,
  input: DuplicateStopInput,
) {
  await connectDB();
  await getTripForActor(tripId, actor);
  await assertGuestStopLimit(actor, tripId);

  const existingStop = (await Stop.findOne({ _id: stopId, planId: tripId }).lean()) as RawStopRecord | null;
  if (!existingStop) {
    throw new StopServiceError("NOT_FOUND", "Stop not found");
  }

  const schedule = buildStopUpdateSchedule(input);
  await assertStopOutsideTransportRanges(tripId, {
    ...schedule,
    isScheduled: schedule.status === "scheduled",
  });

  const sequence =
    schedule.status === "scheduled" && !schedule.time
      ? await getInsertSequenceForScheduledUntimedStop(tripId, schedule.date)
      : await getNextStopSequence(tripId);

  const duplicatedStop = await Stop.create({
    planId: tripId,
    userId: actor.kind === "user" ? actor.userId : `guest:${actor.guestId}`,
    name: existingStop.name ?? "",
    address: existingStop.address ?? "",
    lat: existingStop.lat ?? 0,
    lng: existingStop.lng ?? 0,
    placeId: existingStop.placeId ?? "",
    notes: existingStop.notes ?? "",
    openingHours: Array.isArray(existingStop.openingHours) ? existingStop.openingHours : [],
    phone: existingStop.phone ?? "",
    website: existingStop.website ?? "",
    thumbnail: existingStop.thumbnail ?? "",
    linkedDocIds: Array.isArray(existingStop.linkedDocIds) ? existingStop.linkedDocIds : [],
    sourceType: existingStop.sourceType ?? "manual",
    sourceId: existingStop.sourceId ?? "",
    sourceLabel: existingStop.sourceLabel ?? "",
    editable: existingStop.editable !== false,
    status: schedule.status,
    date: schedule.date,
    time: schedule.time,
    displayTime: schedule.displayTime,
    sequence,
  });

  await resequenceTripStops(tripId);
  await syncTripTravelDates(tripId);
  const refreshedStop = await Stop.findById(duplicatedStop._id).lean();
  return serializeStop(refreshedStop ?? duplicatedStop.toObject(), 1);
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
    .select("_id")
    .lean()) as Array<{ _id: unknown }>;

  if (stops.length !== uniqueStopIds.length) {
    throw new StopServiceError("NOT_FOUND", "Some stops were not found");
  }

  await Promise.all(
    uniqueStopIds.map((stopId, index) =>
      Stop.updateOne(
        { _id: stopId, planId: tripId },
        { $set: { sequence: index + 1 } },
      ),
    ),
  );

  await resequenceTripStops(tripId);
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
    .select("_id")
    .lean()) as Array<{ _id: unknown }>;

  if (stops.length !== uniqueSchedules.length) {
    throw new StopServiceError("NOT_FOUND", "Some stops were not found");
  }

  for (const schedule of uniqueSchedules) {
    const nextSchedule = buildStopUpdateSchedule({
      date: schedule.date,
      time: schedule.time,
    });

    await assertStopOutsideTransportRanges(tripId, {
      ...nextSchedule,
      isScheduled: nextSchedule.status === "scheduled",
    });

    await Stop.updateOne(
      { _id: schedule.stopId, planId: tripId },
      {
        $set: {
          status: nextSchedule.status,
          date: nextSchedule.date,
          time: nextSchedule.time,
          displayTime: nextSchedule.displayTime,
          sequence: schedule.sequence,
        },
      },
    );
  }

  await clearTravelTimesForStops(uniqueSchedules.map((schedule) => schedule.stopId));
  await resequenceTripStops(tripId);
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

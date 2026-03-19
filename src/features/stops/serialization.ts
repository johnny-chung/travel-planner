import type { StopArrival, TripStop } from "@/types/stop";
import type { TripStopSourceType } from "@/types/trip-logistics";

type RawStop = {
  _id?: unknown;
  planId?: unknown;
  name?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
  placeId?: unknown;
  notes?: unknown;
  openingHours?: unknown;
  phone?: unknown;
  website?: unknown;
  thumbnail?: unknown;
  linkedDocIds?: unknown;
  arrivals?: unknown;
  order?: unknown;
  sourceType?: unknown;
  sourceId?: unknown;
  sourceLabel?: unknown;
  displayTime?: unknown;
  editable?: unknown;
  sequence?: unknown;
};

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item));
}

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return fallback;
}

function serializeArrival(value: unknown): StopArrival | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const arrival = value as { date?: unknown; time?: unknown };
  return {
    date: typeof arrival.date === "string" ? arrival.date : "",
    time: typeof arrival.time === "string" ? arrival.time : "",
  };
}

export function serializeStop(stop: RawStop, order: number): TripStop {
  const arrivals = Array.isArray(stop.arrivals)
    ? stop.arrivals
        .map(serializeArrival)
        .filter((arrival): arrival is StopArrival => arrival !== null)
    : [];
  const firstArrival = arrivals[0] ?? { date: "", time: "" };
  const fallbackSequence =
    typeof stop.sequence === "number" && Number.isFinite(stop.sequence)
      ? stop.sequence
      : order;
  const hasScheduledArrival = arrivals.some(
    (arrival) => typeof arrival.date === "string" && arrival.date.trim().length > 0,
  );
  const firstArrivalTime = firstArrival.time ?? "";
  const displayTime = firstArrivalTime.trim().length > 0;

  return {
    _id: String(stop._id),
    planId: String(stop.planId ?? ""),
    name: typeof stop.name === "string" ? stop.name : "",
    address: typeof stop.address === "string" ? stop.address : "",
    lat: toNumber(stop.lat),
    lng: toNumber(stop.lng),
    placeId: typeof stop.placeId === "string" ? stop.placeId : "",
    date: firstArrival.date,
    time: firstArrivalTime,
    sequence: fallbackSequence,
    isScheduled: hasScheduledArrival,
    notes: typeof stop.notes === "string" ? stop.notes : "",
    openingHours: toStringArray(stop.openingHours),
    phone: typeof stop.phone === "string" ? stop.phone : "",
    website: typeof stop.website === "string" ? stop.website : "",
    thumbnail: typeof stop.thumbnail === "string" ? stop.thumbnail : "",
    order:
      typeof stop.order === "number" && Number.isFinite(stop.order)
        ? stop.order
        : order,
    linkedDocIds: toStringArray(stop.linkedDocIds),
    arrivals,
    sourceType:
      typeof stop.sourceType === "string"
        ? (stop.sourceType as TripStopSourceType)
        : "manual",
    sourceId: typeof stop.sourceId === "string" ? stop.sourceId : "",
    sourceLabel: typeof stop.sourceLabel === "string" ? stop.sourceLabel : "",
    displayTime: toBoolean(stop.displayTime, displayTime),
    editable: toBoolean(stop.editable, true),
  };
}

export function serializeStops(stops: RawStop[]) {
  return stops.map((stop, index) => serializeStop(stop, index + 1));
}

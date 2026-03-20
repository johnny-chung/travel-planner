import type { TripStop } from "@/types/stop";
import type { TripStopSourceType } from "@/types/trip-logistics";

type RawStop = {
  _id?: unknown;
  planId?: unknown;
  name?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
  placeId?: unknown;
  date?: unknown;
  time?: unknown;
  status?: unknown;
  notes?: unknown;
  openingHours?: unknown;
  phone?: unknown;
  website?: unknown;
  thumbnail?: unknown;
  linkedDocIds?: unknown;
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
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return fallback;
}

export function serializeStop(stop: RawStop, order: number): TripStop {
  const date = typeof stop.date === "string" ? stop.date : "";
  const time = typeof stop.time === "string" ? stop.time : "";
  const status =
    stop.status === "scheduled" && date
      ? "scheduled"
      : "unscheduled";
  const displayTime = Boolean(time.trim());

  return {
    _id: String(stop._id),
    planId: String(stop.planId ?? ""),
    name: typeof stop.name === "string" ? stop.name : "",
    address: typeof stop.address === "string" ? stop.address : "",
    lat: toNumber(stop.lat),
    lng: toNumber(stop.lng),
    placeId: typeof stop.placeId === "string" ? stop.placeId : "",
    date,
    time,
    status,
    sequence:
      typeof stop.sequence === "number" && Number.isFinite(stop.sequence)
        ? stop.sequence
        : order,
    isScheduled: status === "scheduled",
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

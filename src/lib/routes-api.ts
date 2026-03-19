export type TravelMode = "TRANSIT" | "DRIVE" | "WALK";
export type TravelStepDetail = {
  type: TravelMode;
  label: string;
  durationMinutes: number;
  distanceMeters?: number | null;
  departureStop?: string;
  arrivalStop?: string;
  lineName?: string;
  headsign?: string;
};

export type RouteCalculationResult = {
  durationMinutes: number;
  distanceMeters: number | null;
  mode: TravelMode;
  summary: string;
  details: TravelStepDetail[];
};

const DEFAULT_LOCAL_ARRIVAL_TIME = "09:00";
const timeZoneCache = new Map<string, string>();

/** Maps requested mode → ordered fallback chain */
export function getFallbackChain(mode: TravelMode): TravelMode[] {
  if (mode === "TRANSIT") return ["TRANSIT", "DRIVE", "WALK"];
  if (mode === "DRIVE") return ["DRIVE", "WALK"];
  return ["WALK"];
}

function normalizeLocalTime(time: string): string {
  return time?.trim() ? time : DEFAULT_LOCAL_ARRIVAL_TIME;
}

function getDateParts(date: string) {
  const [year, month, day] = date.split("-").map((value) => parseInt(value, 10));
  return { year, month, day };
}

function getTimeParts(time: string) {
  const normalized = normalizeLocalTime(time);
  const [hour, minute] = normalized.split(":").map((value) => parseInt(value, 10));
  return { hour, minute };
}

function isValidDateParts(year: number, month: number, day: number) {
  return (
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  );
}

function isValidTimeParts(hour: number, minute: number) {
  return (
    Number.isFinite(hour) &&
    Number.isFinite(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

function getUtcPartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const read = (type: string) =>
    parseInt(parts.find((part) => part.type === type)?.value ?? "0", 10);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function getOffsetForTimeZone(date: Date, timeZone: string) {
  const zoned = getUtcPartsInTimeZone(date, timeZone);
  return (
    Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
    ) - date.getTime()
  );
}

function convertLocalDateTimeToIso(date: string, time: string, timeZone: string) {
  const { year, month, day } = getDateParts(date);
  const { hour, minute } = getTimeParts(time);

  if (!isValidDateParts(year, month, day) || !isValidTimeParts(hour, minute)) {
    return null;
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let offset = getOffsetForTimeZone(new Date(utcGuess), timeZone);
  let exactUtc = utcGuess - offset;
  const refinedOffset = getOffsetForTimeZone(new Date(exactUtc), timeZone);

  if (refinedOffset !== offset) {
    offset = refinedOffset;
    exactUtc = utcGuess - offset;
  }

  return new Date(exactUtc).toISOString();
}

async function getTimeZoneId(
  lat: number,
  lng: number,
  date: string,
  time: string,
  apiKey: string,
) {
  const normalizedTime = normalizeLocalTime(time);
  const cacheKey = `${lat.toFixed(4)}:${lng.toFixed(4)}:${date}`;
  const cached = timeZoneCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { year, month, day } = getDateParts(date);
  const { hour, minute } = getTimeParts(normalizedTime);
  if (!isValidDateParts(year, month, day) || !isValidTimeParts(hour, minute)) {
    return null;
  }

  const timestamp = Math.floor(Date.UTC(year, month - 1, day, hour, minute, 0) / 1000);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { status?: string; timeZoneId?: string };
  if (data.status !== "OK" || !data.timeZoneId) {
    return null;
  }

  timeZoneCache.set(cacheKey, data.timeZoneId);
  return data.timeZoneId;
}

/**
 * Returns a future ISO timestamp for the given local date+time at the destination.
 * - If the local date is in the past → use today's date in that same timezone with the same local time.
 * - If the local date is more than 99 days in the future → use today's date in that same timezone
 *   with the same local time (Routes API rejects very far-future times for transit).
 */
async function buildTimestamp(
  date: string,
  time: string,
  lat: number,
  lng: number,
  apiKey: string,
): Promise<string> {
  const timeZone = await getTimeZoneId(lat, lng, date, time, apiKey);
  if (timeZone) {
    const localIso = convertLocalDateTimeToIso(date, time, timeZone);
    if (localIso) {
      const target = new Date(localIso);
      const now = Date.now();
      const limit99Days = 99 * 24 * 60 * 60 * 1000;

      if (target.getTime() >= now && target.getTime() - now <= limit99Days) {
        return target.toISOString();
      }

      const zonedNow = getUtcPartsInTimeZone(new Date(), timeZone);
      const todayInZone = `${zonedNow.year.toString().padStart(4, "0")}-${zonedNow.month
        .toString()
        .padStart(2, "0")}-${zonedNow.day.toString().padStart(2, "0")}`;
      const fallbackIso = convertLocalDateTimeToIso(todayInZone, time, timeZone);
      if (fallbackIso) {
        return fallbackIso;
      }
    }
  }

  const fallbackTime = normalizeLocalTime(time);
  const target = new Date(`${date}T${fallbackTime}:00`);
  const now = Date.now();
  const limit99Days = 99 * 24 * 60 * 60 * 1000;
  const today = new Date().toISOString().slice(0, 10);
  if (target.getTime() < now || target.getTime() - now > limit99Days) {
    return new Date(`${today}T${fallbackTime}:00`).toISOString();
  }
  return target.toISOString();
}

function buildRequestBody(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  mode: TravelMode,
  arrivalTime?: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    origin: { location: { latLng: { latitude: fromLat, longitude: fromLng } } },
    destination: { location: { latLng: { latitude: toLat, longitude: toLng } } },
    travelMode: mode,
  };
  if (mode === "TRANSIT" && arrivalTime) {
    body.arrivalTime = arrivalTime;
  } else if (mode === "DRIVE") {
    body.routingPreference = "TRAFFIC_UNAWARE";
  }
  // WALK: no extra fields needed
  return body;
}

function parseDurationToMinutes(duration?: string): number {
  const seconds = parseInt((duration ?? "0s").replace("s", ""), 10);
  return Number.isNaN(seconds) ? 0 : Math.round(seconds / 60);
}

function formatDistance(distanceMeters?: number | null): string {
  if (!distanceMeters || distanceMeters <= 0) {
    return "";
  }
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }
  return `${(distanceMeters / 1000).toFixed(distanceMeters >= 10000 ? 0 : 1)} km`;
}

type RawRouteResponse = {
  routes?: Array<{
    duration?: string;
    distanceMeters?: number;
    legs?: Array<{
      steps?: Array<{
        staticDuration?: string;
        distanceMeters?: number;
        travelMode?: TravelMode;
        navigationInstruction?: { instructions?: string };
        transitDetails?: {
          stopDetails?: {
            departureStop?: { name?: { text?: string } | string };
            arrivalStop?: { name?: { text?: string } | string };
          };
          headsign?: string;
          transitLine?: {
            name?: string;
            nameShort?: string;
            vehicle?: { name?: { text?: string }; type?: string };
          };
        };
      }>;
    }>;
  }>;
};

type RawRoute = NonNullable<RawRouteResponse["routes"]>[number];
type RawLeg = NonNullable<RawRoute["legs"]>[number];
type RawStep = NonNullable<RawLeg["steps"]>[number];

function readPlaceName(value?: { text?: string } | string): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.text ?? "";
}

function buildTransitLabel(step: RawStep) {
  const transit = step.transitDetails;
  const line = transit?.transitLine;
  const vehicleName = line?.vehicle?.name?.text ?? "";
  const lineName = line?.nameShort ?? line?.name ?? "";
  const headsign = transit?.headsign ?? "";
  const labelBase = [vehicleName, lineName].filter(Boolean).join(" ");
  const stopDetails = transit?.stopDetails;
  return {
    label: labelBase || headsign || "Transit",
    lineName: lineName || vehicleName || "",
    headsign,
    departureStop: readPlaceName(stopDetails?.departureStop?.name),
    arrivalStop: readPlaceName(stopDetails?.arrivalStop?.name),
  };
}

function buildStepDetails(route?: RawRoute): TravelStepDetail[] {
  const steps = route?.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  const details: TravelStepDetail[] = [];

  for (const step of steps) {
    const type = (step.travelMode ?? "WALK") as TravelMode;
    const durationMinutes = parseDurationToMinutes(step.staticDuration);
    const distanceMeters = step.distanceMeters ?? null;

    if (type === "TRANSIT" && step.transitDetails) {
      const transitLabel = buildTransitLabel(step);
      details.push({
        type,
        label: transitLabel.label,
        durationMinutes,
        distanceMeters,
        departureStop: transitLabel.departureStop,
        arrivalStop: transitLabel.arrivalStop,
        lineName: transitLabel.lineName,
        headsign: transitLabel.headsign,
      });
      continue;
    }

    const label =
      type === "DRIVE"
        ? "Drive"
        : step.navigationInstruction?.instructions || "Walk";

    details.push({
      type: type === "DRIVE" ? "DRIVE" : "WALK",
      label,
      durationMinutes,
      distanceMeters,
    });
  }

  return details;
}

function buildSummary(mode: TravelMode, durationMinutes: number, distanceMeters: number | null, details: TravelStepDetail[]) {
  if (mode === "TRANSIT") {
    const transitLabels = details
      .filter((detail) => detail.type === "TRANSIT")
      .map((detail) => detail.label);
    if (transitLabels.length > 0) {
      return `${transitLabels.join(" -> ")} • ${durationMinutes} min`;
    }
  }

  const distanceLabel = formatDistance(distanceMeters);
  return [mode === "DRIVE" ? "Drive" : "Walk", distanceLabel, `${durationMinutes} min`]
    .filter(Boolean)
    .join(" • ");
}

async function calculateRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  mode: TravelMode,
  toDate: string, toTime: string,
  apiKey: string
): Promise<Omit<RouteCalculationResult, "mode"> | null> {
  try {
    const arrivalTime =
      mode === "TRANSIT"
        ? await buildTimestamp(toDate, toTime, toLat, toLng, apiKey)
        : undefined;
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "routes.duration",
          "routes.distanceMeters",
          "routes.legs.steps.staticDuration",
          "routes.legs.steps.distanceMeters",
          "routes.legs.steps.travelMode",
          "routes.legs.steps.navigationInstruction.instructions",
          "routes.legs.steps.transitDetails.headsign",
          "routes.legs.steps.transitDetails.stopDetails.departureStop.name",
          "routes.legs.steps.transitDetails.stopDetails.arrivalStop.name",
          "routes.legs.steps.transitDetails.transitLine.name",
          "routes.legs.steps.transitDetails.transitLine.nameShort",
          "routes.legs.steps.transitDetails.transitLine.vehicle.name.text",
          "routes.legs.steps.transitDetails.transitLine.vehicle.type",
        ].join(","),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildRequestBody(fromLat, fromLng, toLat, toLng, mode, arrivalTime),
      ),
    });
    if (!res.ok) {
      console.error("[Routes API] computeRoutes failed", {
        mode,
        status: res.status,
        body: await res.text(),
      });
      return null;
    }
    const data = await res.json() as RawRouteResponse;
    if (!data.routes?.length) return null;
    const route = data.routes[0];
    const durationMinutes = parseDurationToMinutes(route.duration);
    const distanceMeters = route.distanceMeters ?? null;
    const details = buildStepDetails(route);
    return {
      durationMinutes,
      distanceMeters,
      summary: buildSummary(mode, durationMinutes, distanceMeters, details),
      details,
    };
  } catch {
    return null;
  }
}

/**
 * Tries the requested mode first, then falls back through the chain.
 * Returns the duration and the mode that actually succeeded.
 */
export async function calculateWithFallback(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  requestedMode: TravelMode,
  toDate: string, toTime: string,
  apiKey: string
): Promise<RouteCalculationResult | null> {
  for (const mode of getFallbackChain(requestedMode)) {
    const result = await calculateRoute(fromLat, fromLng, toLat, toLng, mode, toDate, toTime, apiKey);
    if (result !== null) return { ...result, mode };
  }
  return null;
}

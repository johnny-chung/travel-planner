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

/** Maps requested mode → ordered fallback chain */
export function getFallbackChain(mode: TravelMode): TravelMode[] {
  if (mode === "TRANSIT") return ["TRANSIT", "DRIVE", "WALK"];
  if (mode === "DRIVE") return ["DRIVE", "WALK"];
  return ["WALK"];
}

/**
 * Returns a future ISO timestamp for the given date+time.
 * - If the date is in the past → use today's date with the same time.
 * - If the date is more than 99 days in the future → use today's date with the same time
 *   (Routes API rejects very far-future times for transit).
 */
function buildTimestamp(date: string, time: string): string {
  const target = new Date(date + "T" + time + ":00");
  const now = Date.now();
  const limit99Days = 99 * 24 * 60 * 60 * 1000;
  const today = new Date().toISOString().slice(0, 10);
  if (target.getTime() < now || target.getTime() - now > limit99Days) {
    return new Date(today + "T" + time + ":00").toISOString();
  }
  return target.toISOString();
}

function buildRequestBody(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  mode: TravelMode,
  toDate: string, toTime: string
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    origin: { location: { latLng: { latitude: fromLat, longitude: fromLng } } },
    destination: { location: { latLng: { latitude: toLat, longitude: toLng } } },
    travelMode: mode,
  };
  if (mode === "TRANSIT") {
    body.arrivalTime = buildTimestamp(toDate, toTime);
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
      body: JSON.stringify(buildRequestBody(fromLat, fromLng, toLat, toLng, mode, toDate, toTime)),
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

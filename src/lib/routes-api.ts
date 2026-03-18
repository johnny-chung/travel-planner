export type TravelMode = "TRANSIT" | "DRIVE" | "WALK";

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

async function calculateDuration(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  mode: TravelMode,
  toDate: string, toTime: string,
  apiKey: string
): Promise<number | null> {
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildRequestBody(fromLat, fromLng, toLat, toLng, mode, toDate, toTime)),
    });
    if (!res.ok) return null;
    const data = await res.json() as { routes?: Array<{ duration?: string }> };
    if (!data.routes?.length) return null;
    const seconds = parseInt((data.routes[0].duration ?? "0s").replace("s", ""), 10);
    return isNaN(seconds) ? null : Math.round(seconds / 60);
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
): Promise<{ durationMinutes: number; mode: TravelMode } | null> {
  for (const mode of getFallbackChain(requestedMode)) {
    const dur = await calculateDuration(fromLat, fromLng, toLat, toLng, mode, toDate, toTime, apiKey);
    if (dur !== null) return { durationMinutes: dur, mode };
  }
  return null;
}

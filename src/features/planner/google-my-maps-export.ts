import type { TripStop } from "@/types/stop";
import type { TripStayItem } from "@/types/trip-logistics";

export type GoogleMyMapsExportRow = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  placeId: string;
  type: "stop" | "stay";
  date: string;
  time: string;
  notes: string;
  googleMapsUrl: string;
};

function buildPlaceKey(input: {
  placeId?: string;
  lat?: number | null;
  lng?: number | null;
  name?: string;
}) {
  if (input.placeId) {
    return `place:${input.placeId}`;
  }

  if (
    typeof input.lat === "number" &&
    Number.isFinite(input.lat) &&
    typeof input.lng === "number" &&
    Number.isFinite(input.lng)
  ) {
    return `coord:${input.lat},${input.lng}:${input.name ?? ""}`;
  }

  return `name:${input.name ?? ""}`;
}

function buildGoogleMapsUrl(input: {
  name: string;
  address: string;
  placeId?: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const base = "https://www.google.com/maps/search/?api=1";

  if (input.placeId) {
    return `${base}&query=${encodeURIComponent(input.address || input.name)}&query_place_id=${encodeURIComponent(input.placeId)}`;
  }

  if (
    typeof input.lat === "number" &&
    Number.isFinite(input.lat) &&
    typeof input.lng === "number" &&
    Number.isFinite(input.lng)
  ) {
    return `${base}&query=${encodeURIComponent(`${input.lat},${input.lng}`)}`;
  }

  return `${base}&query=${encodeURIComponent(input.address || input.name)}`;
}

function csvCell(value: string) {
  const normalized = value.replace(/\r\n/g, "\n");
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function buildGoogleMyMapsExportRows(
  stops: TripStop[],
  stays: TripStayItem[],
) {
  const rows: GoogleMyMapsExportRow[] = [];
  const seen = new Set<string>();

  for (const stop of stops) {
    const key = buildPlaceKey({
      placeId: stop.placeId,
      lat: stop.lat,
      lng: stop.lng,
      name: stop.name,
    });

    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    rows.push({
      name: stop.name,
      address: stop.address,
      latitude: Number.isFinite(stop.lat) ? String(stop.lat) : "",
      longitude: Number.isFinite(stop.lng) ? String(stop.lng) : "",
      placeId: stop.placeId ?? "",
      type: "stop",
      date: stop.date ?? "",
      time: stop.time ?? "",
      notes: stop.notes ?? "",
      googleMapsUrl: buildGoogleMapsUrl({
        name: stop.name,
        address: stop.address,
        placeId: stop.placeId,
        lat: stop.lat,
        lng: stop.lng,
      }),
    });
  }

  for (const stay of stays) {
    const key = buildPlaceKey({
      placeId: stay.placeId,
      lat: stay.lat,
      lng: stay.lng,
      name: stay.name,
    });

    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    rows.push({
      name: stay.name,
      address: stay.address,
      latitude: Number.isFinite(stay.lat) ? String(stay.lat) : "",
      longitude: Number.isFinite(stay.lng) ? String(stay.lng) : "",
      placeId: stay.placeId ?? "",
      type: "stay",
      date: stay.checkInDate ?? "",
      time: "",
      notes: "",
      googleMapsUrl: buildGoogleMapsUrl({
        name: stay.name,
        address: stay.address,
        placeId: stay.placeId,
        lat: stay.lat,
        lng: stay.lng,
      }),
    });
  }

  return rows;
}

export function buildGoogleMyMapsCsv(rows: GoogleMyMapsExportRow[]) {
  const header = [
    "name",
    "address",
    "latitude",
    "longitude",
    "placeId",
    "type",
    "date",
    "time",
    "notes",
    "googleMapsUrl",
  ];

  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.name,
        row.address,
        row.latitude,
        row.longitude,
        row.placeId,
        row.type,
        row.date,
        row.time,
        row.notes,
        row.googleMapsUrl,
      ]
        .map((value) => csvCell(value))
        .join(","),
    ),
  ];

  return lines.join("\n");
}

export function buildGoogleMyMapsFilename(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${slug || "trip"}-google-my-maps.csv`;
}

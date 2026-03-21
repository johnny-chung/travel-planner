import "server-only";

import { connectDB } from "@/lib/mongodb";
import { TripServiceError } from "@/features/trips/errors";
import { buildEndpointPrefixPattern } from "@/features/planner/timeline";
import { canActorAccessTrip, type TripActor } from "@/features/trips/access";
import { TripStay } from "@/lib/models/TripStay";
import { TripTransport } from "@/lib/models/TripTransport";
import { Trip } from "@/lib/models/Trip";
import { Stop } from "@/lib/models/Stop";
import { TravelTime } from "@/lib/models/TravelTime";
import { AirportCache } from "@/lib/models/AirportCache";
import { syncTripTravelDates } from "@/features/trips/travel-dates";
import type {
  CachedAirport,
  FlightRouteSuggestion,
  TripLocationPoint,
  TripStayItem,
  TripTransportItem,
  TripTransportType,
} from "@/types/trip-logistics";

type TripAccessRecord = {
  userId?: string;
  guestId?: string | null;
  ownerType?: "user" | "guest";
  editors?: string[];
  status?: string;
};

type AddTransportInput = {
  type: TripTransportType;
  title?: string;
  flightNumber?: string;
  departureDate: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  departureName?: string;
  departureAddress?: string;
  departureLat?: number | null;
  departureLng?: number | null;
  departurePlaceId?: string;
  arrivalName?: string;
  arrivalAddress?: string;
  arrivalLat?: number | null;
  arrivalLng?: number | null;
  arrivalPlaceId?: string;
};

type AddStayInput = {
  name: string;
  address: string;
  placeId?: string;
  lat: number;
  lng: number;
  checkInDate: string;
  checkOutDate: string;
  thumbnail?: string;
  phone?: string;
  website?: string;
};

type RawTransport = {
  _id: unknown;
  type?: unknown;
  title?: unknown;
  flightNumber?: unknown;
  departureDate?: unknown;
  departureTime?: unknown;
  arrivalDate?: unknown;
  arrivalTime?: unknown;
  departure?: {
    name?: unknown;
    address?: unknown;
    placeId?: unknown;
    lat?: unknown;
    lng?: unknown;
  };
  arrival?: {
    name?: unknown;
    address?: unknown;
    placeId?: unknown;
    lat?: unknown;
    lng?: unknown;
  };
  sourceMode?: unknown;
};

type RawStay = {
  _id: unknown;
  name?: unknown;
  address?: unknown;
  placeId?: unknown;
  lat?: unknown;
  lng?: unknown;
  checkInDate?: unknown;
  checkOutDate?: unknown;
  thumbnail?: unknown;
  phone?: unknown;
  website?: unknown;
};

function ensureDate(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TripServiceError("VALIDATION_ERROR", `${field} is required`);
  }
  return value;
}

function ensureTime(value: string, field: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new TripServiceError("VALIDATION_ERROR", `${field} is required`);
  }
  return value;
}

function ensureText(value: string | undefined, field: string) {
  const nextValue = value?.trim() ?? "";
  if (!nextValue) {
    throw new TripServiceError("VALIDATION_ERROR", `${field} is required`);
  }
  return nextValue;
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializeLocationPoint(raw: RawTransport["departure"]): TripLocationPoint {
  return {
    name: typeof raw?.name === "string" ? raw.name : "",
    address: typeof raw?.address === "string" ? raw.address : "",
    placeId: typeof raw?.placeId === "string" ? raw.placeId : "",
    lat: toNullableNumber(raw?.lat),
    lng: toNullableNumber(raw?.lng),
  };
}

function serializeTransport(raw: RawTransport): TripTransportItem {
  return {
    _id: String(raw._id),
    type: raw.type === "custom" ? "custom" : "flight",
    title: typeof raw.title === "string" ? raw.title : "",
    flightNumber: typeof raw.flightNumber === "string" ? raw.flightNumber : "",
    departureDate:
      typeof raw.departureDate === "string" ? raw.departureDate : "",
    departureTime:
      typeof raw.departureTime === "string" ? raw.departureTime : "",
    arrivalDate: typeof raw.arrivalDate === "string" ? raw.arrivalDate : "",
    arrivalTime: typeof raw.arrivalTime === "string" ? raw.arrivalTime : "",
    departure: serializeLocationPoint(raw.departure),
    arrival: serializeLocationPoint(raw.arrival),
    sourceMode: raw.sourceMode === "airlabs" ? "airlabs" : "manual",
  };
}

function serializeStay(raw: RawStay): TripStayItem {
  return {
    _id: String(raw._id),
    name: typeof raw.name === "string" ? raw.name : "",
    address: typeof raw.address === "string" ? raw.address : "",
    placeId: typeof raw.placeId === "string" ? raw.placeId : "",
    lat: toNullableNumber(raw.lat) ?? 0,
    lng: toNullableNumber(raw.lng) ?? 0,
    checkInDate:
      typeof raw.checkInDate === "string" ? raw.checkInDate : "",
    checkOutDate:
      typeof raw.checkOutDate === "string" ? raw.checkOutDate : "",
    thumbnail: typeof raw.thumbnail === "string" ? raw.thumbnail : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    website: typeof raw.website === "string" ? raw.website : "",
  };
}

async function getEditableTripForUser(tripId: string, userId: string) {
  return getEditableTripForActor(tripId, { kind: "user", userId });
}

async function getEditableTripForActor(tripId: string, actor: TripActor) {
  const trip = (await Trip.findOne({ _id: tripId }).lean()) as
    | TripAccessRecord
    | null;

  if (!trip || !canActorAccessTrip(trip, actor)) {
    throw new TripServiceError("NOT_FOUND", "Trip not found");
  }

  if (trip.status === "archived") {
    throw new TripServiceError("INVALID_STATE", "Trip is archived");
  }

  return trip;
}

function normalizeFlightNumber(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidFlightNumber(value: string) {
  return /^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(normalizeFlightNumber(value));
}

function getAirLabsApiKey() {
  const apiKey = process.env.AIRLABS_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new TripServiceError(
      "CONFIG_ERROR",
      "AIRLABS_API_KEY is not configured",
    );
  }
  return apiKey;
}

type AirLabsResponse<T> = {
  error?: { message?: string; code?: string | number };
  response?: T;
};

type AirLabsFlightRecord = {
  airline_iata?: string;
  flight_iata?: string;
  flight_number?: string;
  dep_iata?: string;
  dep_time?: string;
  dep_estimated?: string;
  dep_actual?: string;
  arr_iata?: string;
  arr_time?: string;
  arr_estimated?: string;
  arr_actual?: string;
  duration?: number | null;
  status?: string;
};

type AirLabsRouteRecord = {
  airline_iata?: string;
  flight_iata?: string;
  flight_number?: string;
  dep_iata?: string;
  dep_time?: string;
  arr_iata?: string;
  arr_time?: string;
  duration?: number | null;
  days?: string[];
};

type AirLabsAirportRecord = {
  name?: string;
  iata_code?: string;
  icao_code?: string;
  lat?: number;
  lng?: number;
  city?: string;
  country_code?: string;
  website?: string;
};

function formatAirportAddress(airport: CachedAirport) {
  return [airport.name, airport.city, airport.countryCode].filter(Boolean).join(", ");
}

export function toLocationPoint(airport: CachedAirport): TripLocationPoint {
  return {
    name: [airport.name, airport.iataCode].filter(Boolean).join(" · "),
    address: formatAirportAddress(airport),
    placeId: airport.iataCode,
    lat: airport.lat,
    lng: airport.lng,
  };
}

function pickBestFlightTime(
  actual?: string,
  estimated?: string,
  scheduled?: string,
) {
  const value = actual || estimated || scheduled || "";
  return value ? value.slice(11, 16) : "";
}

function toFlightSuggestion(
  record: {
    airline_iata?: string;
    flight_iata?: string;
    flight_number?: string;
    dep_time?: string;
    arr_time?: string;
    duration?: number | null;
    days?: string[];
  },
  departureAirport: CachedAirport,
  arrivalAirport: CachedAirport,
  index: number,
  normalizedFlightNumber: string,
): FlightRouteSuggestion {
  return {
    id: `${record.flight_iata ?? normalizedFlightNumber}-${departureAirport.iataCode}-${arrivalAirport.iataCode}-${index}`,
    flightIata: record.flight_iata ?? normalizedFlightNumber,
    flightNumber:
      record.flight_number ??
      normalizedFlightNumber.replace(/^[A-Z0-9]{2,3}/, ""),
    airlineIata: record.airline_iata ?? normalizedFlightNumber.slice(0, 2),
    departureTime: record.dep_time ?? "",
    arrivalTime: record.arr_time ?? "",
    departureAirport,
    arrivalAirport,
    durationMinutes:
      typeof record.duration === "number" ? record.duration : null,
    days: Array.isArray(record.days) ? record.days : [],
  };
}

async function fetchAirLabsJson<T>(url: URL): Promise<T[]> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as AirLabsResponse<T> | T;

  if (!response.ok) {
    throw new TripServiceError("LOOKUP_FAILED", "Failed to reach AirLabs");
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error
  ) {
    throw new TripServiceError(
      "LOOKUP_FAILED",
      payload.error.message ?? "AirLabs lookup failed",
    );
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "response" in payload &&
    payload.response &&
    !Array.isArray(payload.response)
  ) {
    return [payload.response as T];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "response" in payload &&
    Array.isArray(payload.response)
  ) {
    return payload.response;
  }

  throw new TripServiceError("LOOKUP_FAILED", "Unexpected AirLabs response");
}

async function getCachedAirportByIataCode(iataCode: string): Promise<CachedAirport> {
  const normalizedCode = iataCode.trim().toUpperCase();
  const cached = (await AirportCache.findOne({ iataCode: normalizedCode })
    .lean()) as
    | {
        iataCode?: string;
        icaoCode?: string;
        name?: string;
        city?: string;
        countryCode?: string;
        website?: string;
        lat?: number;
        lng?: number;
      }
    | null;

  if (cached && typeof cached.lat === "number" && typeof cached.lng === "number") {
    return {
      iataCode: cached.iataCode ?? normalizedCode,
      icaoCode: cached.icaoCode ?? "",
      name: cached.name ?? normalizedCode,
      city: cached.city ?? "",
      countryCode: cached.countryCode ?? "",
      website: cached.website ?? "",
      lat: cached.lat,
      lng: cached.lng,
    };
  }

  const requestUrl = new URL("https://airlabs.co/api/v9/airports");
  requestUrl.searchParams.set("iata_code", normalizedCode);
  requestUrl.searchParams.set(
    "_fields",
    "name,iata_code,icao_code,lat,lng,city,country_code,website",
  );
  requestUrl.searchParams.set("api_key", getAirLabsApiKey());

  const records = await fetchAirLabsJson<AirLabsAirportRecord>(requestUrl);
  const airport = records[0];
  if (
    !airport ||
    typeof airport.lat !== "number" ||
    typeof airport.lng !== "number" ||
    typeof airport.iata_code !== "string"
  ) {
    throw new TripServiceError(
      "LOOKUP_FAILED",
      `Airport lookup failed for ${normalizedCode}`,
    );
  }

  const normalizedAirport: CachedAirport = {
    iataCode: airport.iata_code,
    icaoCode: airport.icao_code ?? "",
    name: airport.name ?? normalizedCode,
    city: airport.city ?? "",
    countryCode: airport.country_code ?? "",
    website: airport.website ?? "",
    lat: airport.lat,
    lng: airport.lng,
  };

  await AirportCache.findOneAndUpdate(
    { iataCode: normalizedAirport.iataCode },
    normalizedAirport,
    { upsert: true },
  );

  return normalizedAirport;
}

export async function lookupFlightRouteSuggestions(
  flightNumber: string,
): Promise<FlightRouteSuggestion[]> {
  await connectDB();
  const normalizedFlightNumber = normalizeFlightNumber(flightNumber);
  if (!isValidFlightNumber(normalizedFlightNumber)) {
    return [];
  }

  const apiKey = getAirLabsApiKey();
  const flightUrl = new URL("https://airlabs.co/api/v9/flight");
  flightUrl.searchParams.set("flight_iata", normalizedFlightNumber);
  flightUrl.searchParams.set(
    "_fields",
    "airline_iata,flight_iata,flight_number,dep_iata,dep_time,dep_estimated,dep_actual,arr_iata,arr_time,arr_estimated,arr_actual,duration,status",
  );
  flightUrl.searchParams.set("api_key", apiKey);

  let records: AirLabsRouteRecord[] = [];

  try {
    const flightRecords = await fetchAirLabsJson<AirLabsFlightRecord>(flightUrl);
    records = flightRecords
      .filter(
        (record) =>
          typeof record.dep_iata === "string" &&
          typeof record.arr_iata === "string",
      )
      .map((record) => ({
        airline_iata: record.airline_iata,
        flight_iata: record.flight_iata,
        flight_number: record.flight_number,
        dep_iata: record.dep_iata,
        dep_time: pickBestFlightTime(
          record.dep_actual,
          record.dep_estimated,
          record.dep_time,
        ),
        arr_iata: record.arr_iata,
        arr_time: pickBestFlightTime(
          record.arr_actual,
          record.arr_estimated,
          record.arr_time,
        ),
        duration: record.duration,
        days: [],
      }))
      .filter((record) => record.dep_time && record.arr_time);
  } catch {
    records = [];
  }

  if (records.length === 0) {
    const routesUrl = new URL("https://airlabs.co/api/v9/routes");
    routesUrl.searchParams.set("flight_iata", normalizedFlightNumber);
    routesUrl.searchParams.set(
      "_fields",
      "airline_iata,flight_iata,flight_number,dep_iata,dep_time,arr_iata,arr_time,duration,days",
    );
    routesUrl.searchParams.set("limit", "5");
    routesUrl.searchParams.set("api_key", apiKey);
    records = await fetchAirLabsJson<AirLabsRouteRecord>(routesUrl);
  }

  const uniqueRecords = records.filter(
    (record, index, list) =>
      typeof record.dep_iata === "string" &&
      typeof record.arr_iata === "string" &&
      typeof record.dep_time === "string" &&
      typeof record.arr_time === "string" &&
      list.findIndex(
        (other) =>
          other.dep_iata === record.dep_iata &&
          other.arr_iata === record.arr_iata &&
          other.dep_time === record.dep_time &&
          other.arr_time === record.arr_time,
      ) === index,
  );

  const airportCodes = [
    ...new Set(
      uniqueRecords.flatMap((record) => [record.dep_iata ?? "", record.arr_iata ?? ""]),
    ),
  ].filter(Boolean);
  const airportMap = new Map(
    (
      await Promise.all(
        airportCodes.map(async (code) => [code, await getCachedAirportByIataCode(code)] as const),
      )
    ),
  );

  return uniqueRecords
    .map((record, index) => {
      const departureAirport = airportMap.get(record.dep_iata ?? "");
      const arrivalAirport = airportMap.get(record.arr_iata ?? "");
      if (!departureAirport || !arrivalAirport) {
        return null;
      }

      return toFlightSuggestion(
        record,
        departureAirport,
        arrivalAirport,
        index,
        normalizedFlightNumber,
      );
    })
    .filter((record): record is FlightRouteSuggestion => record !== null);
}

function buildManualLocationPoint(input: {
  name?: string;
  address?: string;
  placeId?: string;
  lat?: number | null;
  lng?: number | null;
}, label: string): TripLocationPoint {
  const address = ensureText(input.address, `${label} location`);

  if (typeof input.lat !== "number" || typeof input.lng !== "number") {
    throw new TripServiceError(
      "VALIDATION_ERROR",
      `${label} location is required`,
    );
  }

  return {
    name: input.name?.trim() || address.split(",")[0] || address,
    address,
    placeId: input.placeId?.trim() ?? "",
    lat: input.lat,
    lng: input.lng,
  };
}

function buildTransportItem(input: AddTransportInput): Omit<TripTransportItem, "_id"> {
  if (input.type === "flight") {
    const flightNumber = ensureText(input.flightNumber, "Flight number");
    const departureDate = ensureDate(input.departureDate, "Departure date");
    return {
      type: "flight",
      title: `Flight ${normalizeFlightNumber(flightNumber)}`,
      flightNumber: normalizeFlightNumber(flightNumber),
      departureDate,
      departureTime: ensureTime(input.departureTime ?? "", "Departure time"),
      arrivalDate: ensureDate(input.arrivalDate ?? "", "Arrival date"),
      arrivalTime: ensureTime(input.arrivalTime ?? "", "Arrival time"),
      departure: buildManualLocationPoint(
        {
          name: input.departureName,
          address: input.departureAddress,
          placeId: input.departurePlaceId,
          lat: input.departureLat,
          lng: input.departureLng,
        },
        "Departure airport",
      ),
      arrival: buildManualLocationPoint(
        {
          name: input.arrivalName,
          address: input.arrivalAddress,
          placeId: input.arrivalPlaceId,
          lat: input.arrivalLat,
          lng: input.arrivalLng,
        },
        "Arrival airport",
      ),
      sourceMode: "airlabs",
    };
  }

  return {
    type: "custom",
    title: ensureText(input.title, "Transport title"),
    flightNumber: "",
    departureDate: ensureDate(input.departureDate, "Departure date"),
    departureTime: ensureTime(input.departureTime ?? "", "Departure time"),
    arrivalDate: ensureDate(input.arrivalDate ?? "", "Arrival date"),
    arrivalTime: ensureTime(input.arrivalTime ?? "", "Arrival time"),
    departure: buildManualLocationPoint(
      {
        name: input.departureName,
        address: input.departureAddress,
        placeId: input.departurePlaceId,
        lat: input.departureLat,
        lng: input.departureLng,
      },
      "Departure",
    ),
    arrival: buildManualLocationPoint(
      {
        name: input.arrivalName,
        address: input.arrivalAddress,
        placeId: input.arrivalPlaceId,
        lat: input.arrivalLat,
        lng: input.arrivalLng,
      },
      "Arrival",
    ),
    sourceMode: "manual",
  };
}

function buildStayItem(input: AddStayInput) {
  const checkInDate = ensureDate(input.checkInDate, "Check-in date");
  const checkOutDate = ensureDate(input.checkOutDate, "Check-out date");

  if (checkOutDate < checkInDate) {
    throw new TripServiceError(
      "VALIDATION_ERROR",
      "Check-out date must be on or after check-in",
    );
  }

  return {
    name: ensureText(input.name, "Stay name"),
    address: ensureText(input.address, "Stay address"),
    placeId: input.placeId?.trim() ?? "",
    lat: input.lat,
    lng: input.lng,
    checkInDate,
    checkOutDate,
    thumbnail: input.thumbnail?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    website: input.website?.trim() ?? "",
  };
}

export function isVisitWithinTransportRange(
  visit: { date: string; time?: string },
  transports: TripTransportItem[],
) {
  if (!visit.date || !visit.time) {
    return null;
  }

  const arrivalStamp = `${visit.date}T${visit.time}`;

  return transports.find((transport) => {
    const departureStamp = `${transport.departureDate}T${transport.departureTime}`;
    const arrivalTransportStamp = `${transport.arrivalDate}T${transport.arrivalTime}`;
    return arrivalStamp >= departureStamp && arrivalStamp <= arrivalTransportStamp;
  }) ?? null;
}

function addMinutesToVisit(
  visit: { date: string; time?: string },
  minutes: number,
) {
  const value = new Date(`${visit.date}T${visit.time}:00Z`);
  value.setUTCMinutes(value.getUTCMinutes() + minutes);
  return {
    date: value.toISOString().slice(0, 10),
    time: value.toISOString().slice(11, 16),
  };
}

async function shiftStopsAfterTransportConflict(
  tripId: string,
  transport: Omit<TripTransportItem, "_id">,
) {
  const stops = (await Stop.find({ planId: tripId })
    .select("_id status date time")
    .lean()) as Array<{ _id: unknown; status?: string; date?: string; time?: string }>;

  const conflictingStops = stops
    .filter(
      (stop) =>
        stop.status === "scheduled" &&
        typeof stop.date === "string" &&
        typeof stop.time === "string" &&
        isVisitWithinTransportRange(
          { date: stop.date, time: stop.time },
          [{ _id: "", ...transport }],
        ) !== null,
    )
    .sort(
      (left, right) =>
        `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`),
    );

  if (conflictingStops.length === 0) {
    return;
  }

  let cursor = {
    date: transport.arrivalDate,
    time: transport.arrivalTime,
  };

  for (const stop of conflictingStops) {
    cursor = addMinutesToVisit(cursor, 1);
    await Stop.findOneAndUpdate(
      { _id: stop._id, planId: tripId },
      {
        status: "scheduled",
        date: cursor.date,
        time: cursor.time,
        displayTime: true,
      },
    );

    const endpointPattern = buildEndpointPrefixPattern(String(stop._id));
    await TravelTime.deleteMany({
      $or: [{ fromStopId: endpointPattern }, { toStopId: endpointPattern }],
    });
  }
}

export async function getTransportItemsForTrip(tripId: string) {
  await connectDB();
  const records = (await TripTransport.find({ tripId })
    .sort({ departureDate: 1, departureTime: 1 })
    .lean()) as RawTransport[];
  return records.map(serializeTransport);
}

export async function getStayItemsForTrip(tripId: string) {
  await connectDB();
  const records = (await TripStay.find({ tripId })
    .sort({ checkInDate: 1, checkOutDate: 1 })
    .lean()) as RawStay[];
  return records.map(serializeStay);
}

export async function addTransportForUser(
  tripId: string,
  userId: string,
  input: AddTransportInput,
) {
  await connectDB();
  await getEditableTripForUser(tripId, userId);
  const nextItem = buildTransportItem(input);

  await TripTransport.create({
    tripId,
    userId,
    ...nextItem,
  });

  await shiftStopsAfterTransportConflict(tripId, nextItem);
  await syncTripTravelDates(tripId);
}

export async function updateTransportForUser(
  tripId: string,
  userId: string,
  transportId: string,
  input: AddTransportInput,
) {
  await connectDB();
  await getEditableTripForUser(tripId, userId);
  const nextItem = buildTransportItem(input);

  const updated = await TripTransport.findOneAndUpdate(
    { _id: transportId, tripId },
    nextItem,
    { new: true },
  ).lean();

  if (!updated) {
    throw new TripServiceError("NOT_FOUND", "Transport item not found");
  }

  await shiftStopsAfterTransportConflict(tripId, nextItem);
  await syncTripTravelDates(tripId);
}

export async function deleteTransportForUser(
  tripId: string,
  userId: string,
  transportId: string,
) {
  await connectDB();
  await getEditableTripForUser(tripId, userId);

  const deleted = await TripTransport.findOneAndDelete({
    _id: transportId,
    tripId,
  }).lean();

  if (!deleted) {
    throw new TripServiceError("NOT_FOUND", "Transport item not found");
  }

  await syncTripTravelDates(tripId);
}

export async function addStayForUser(
  tripId: string,
  userId: string,
  input: AddStayInput,
) {
  await connectDB();
  await getEditableTripForUser(tripId, userId);
  const nextItem = buildStayItem(input);

  await TripStay.create({
    tripId,
    userId,
    ...nextItem,
  });

  await syncTripTravelDates(tripId);
}

export async function updateStayForUser(
  tripId: string,
  userId: string,
  stayId: string,
  input: AddStayInput,
) {
  await connectDB();
  await getEditableTripForUser(tripId, userId);
  const nextItem = buildStayItem(input);

  const updated = await TripStay.findOneAndUpdate(
    { _id: stayId, tripId },
    nextItem,
    { new: true },
  ).lean();

  if (!updated) {
    throw new TripServiceError("NOT_FOUND", "Stay not found");
  }

  await syncTripTravelDates(tripId);
}

export async function deleteStayForUser(
  tripId: string,
  userId: string,
  stayId: string,
) {
  await connectDB();
  await getEditableTripForUser(tripId, userId);

  const deleted = await TripStay.findOneAndDelete({
    _id: stayId,
    tripId,
  }).lean();

  if (!deleted) {
    throw new TripServiceError("NOT_FOUND", "Stay not found");
  }

  const endpointPattern = buildEndpointPrefixPattern(stayId);
  await TravelTime.deleteMany({
    $or: [{ fromStopId: endpointPattern }, { toStopId: endpointPattern }],
  });
  await syncTripTravelDates(tripId);
}

export async function addStayForGuest(
  tripId: string,
  guestId: string,
  input: AddStayInput,
) {
  await connectDB();
  await getEditableTripForActor(tripId, { kind: "guest", guestId });
  const nextItem = buildStayItem(input);

  await TripStay.create({
    tripId,
    userId: "",
    ...nextItem,
  });

  await syncTripTravelDates(tripId);
}

export async function updateStayForGuest(
  tripId: string,
  guestId: string,
  stayId: string,
  input: AddStayInput,
) {
  await connectDB();
  await getEditableTripForActor(tripId, { kind: "guest", guestId });
  const nextItem = buildStayItem(input);

  const updated = await TripStay.findOneAndUpdate(
    { _id: stayId, tripId },
    nextItem,
    { new: true },
  ).lean();

  if (!updated) {
    throw new TripServiceError("NOT_FOUND", "Stay not found");
  }

  await syncTripTravelDates(tripId);
}

export async function deleteStayForGuest(
  tripId: string,
  guestId: string,
  stayId: string,
) {
  await connectDB();
  await getEditableTripForActor(tripId, { kind: "guest", guestId });

  const deleted = await TripStay.findOneAndDelete({
    _id: stayId,
    tripId,
  }).lean();

  if (!deleted) {
    throw new TripServiceError("NOT_FOUND", "Stay not found");
  }

  const endpointPattern = buildEndpointPrefixPattern(stayId);
  await TravelTime.deleteMany({
    $or: [{ fromStopId: endpointPattern }, { toStopId: endpointPattern }],
  });
  await syncTripTravelDates(tripId);
}

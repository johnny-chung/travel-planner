export type TripStopSourceType =
  | "manual"
  | "flight"
  | "custom_transport"
  | "stay";

export type TripTransportType = "flight" | "custom";

export type TripLocationPoint = {
  name: string;
  address: string;
  placeId: string;
  lat: number | null;
  lng: number | null;
};

export type CachedAirport = {
  iataCode: string;
  icaoCode: string;
  name: string;
  city: string;
  countryCode: string;
  website: string;
  lat: number;
  lng: number;
};

export type TripTransportItem = {
  _id: string;
  type: TripTransportType;
  title: string;
  flightNumber: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  departure: TripLocationPoint;
  arrival: TripLocationPoint;
  sourceMode: "manual" | "airlabs";
};

export type FlightRouteSuggestion = {
  id: string;
  flightIata: string;
  flightNumber: string;
  airlineIata: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: CachedAirport;
  arrivalAirport: CachedAirport;
  durationMinutes: number | null;
  days: string[];
};

export type TripStayItem = {
  _id: string;
  name: string;
  address: string;
  placeId: string;
  lat: number;
  lng: number;
  checkInDate: string;
  checkOutDate: string;
  thumbnail: string;
  phone: string;
  website: string;
};

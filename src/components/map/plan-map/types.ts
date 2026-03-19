import type { TripStop } from "@/types/stop";
import type { TripStayItem, TripTransportItem } from "@/types/trip-logistics";
import type { PlannerSearchState } from "@/features/planner/search-params";

export type Stop = TripStop;

export type TripDoc = {
  _id: string;
  name: string;
  url: string;
};

export type PendingLocation = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  openingHours: string[];
  phone: string;
  website: string;
  thumbnail: string;
  rating?: number | null;
  userRatingCount?: number | null;
};

export type TravelTimeEntry = {
  _id: string;
  fromStopId: string;
  toStopId: string;
  mode: "TRANSIT" | "DRIVE" | "WALK";
  durationMinutes: number;
  distanceMeters?: number | null;
  summary?: string;
  details?: TravelStepDetail[];
};

export type TravelStepDetail = {
  type: "TRANSIT" | "DRIVE" | "WALK";
  label: string;
  durationMinutes: number;
  distanceMeters?: number | null;
  departureStop?: string;
  arrivalStop?: string;
  lineName?: string;
  headsign?: string;
};

export type PlanMapPlan = {
  _id: string;
  name: string;
  description: string;
  centerLat: number | null;
  centerLng: number | null;
  centerName: string;
  transportMode?: string;
};

export type PlanMapProps = {
  plan: PlanMapPlan;
  stops: Stop[];
  googleMapsApiKey: string;
  pathname: string;
  searchState: PlannerSearchState;
  isArchived?: boolean;
  tripDocs?: TripDoc[];
  accessMode?: "user" | "guest";
};

export type PlannerTimelineStopItem = {
  kind: "stop";
  id: string;
  date: string;
  time: string;
  stop: Stop;
};

export type PlannerTimelineTransportItem = {
  kind: "transport";
  id: string;
  date: string;
  time: string;
  boundary: "departure" | "arrival";
  transport: TripTransportItem;
};

export type PlannerTimelineStayItem = {
  kind: "stay";
  id: string;
  date: string;
  time: string;
  boundary: "start" | "end";
  stay: TripStayItem;
};

export type PlannerTimelineItem =
  | PlannerTimelineStopItem
  | PlannerTimelineTransportItem
  | PlannerTimelineStayItem;

export type PlannerRouteNode = {
  id: string;
  kind: "stop" | "stay" | "transport";
  date: string;
  time: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  displayTime: boolean;
  stop?: Stop;
  stay?: TripStayItem;
  transport?: TripTransportItem;
  boundary?: "start" | "end" | "departure" | "arrival";
};

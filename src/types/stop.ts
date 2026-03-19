import type { TripStopSourceType } from "@/types/trip-logistics";

export type StopArrival = {
  date: string;
  time: string;
};

export type TripStop = {
  _id: string;
  planId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  date: string;
  time: string;
  notes: string;
  openingHours: string[];
  phone: string;
  website: string;
  thumbnail: string;
  order: number;
  linkedDocIds: string[];
  arrivals: StopArrival[];
  _arrivalIndex?: number;
  sourceType: TripStopSourceType;
  sourceId: string;
  sourceLabel: string;
  displayTime: boolean;
  editable: boolean;
};

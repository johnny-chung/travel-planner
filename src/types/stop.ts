import type { TripStopSourceType } from "@/types/trip-logistics";

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
  status: "scheduled" | "unscheduled";
  sequence: number;
  isScheduled: boolean;
  notes: string;
  openingHours: string[];
  phone: string;
  website: string;
  thumbnail: string;
  order: number;
  linkedDocIds: string[];
  sourceType: TripStopSourceType;
  sourceId: string;
  sourceLabel: string;
  displayTime: boolean;
  editable: boolean;
};

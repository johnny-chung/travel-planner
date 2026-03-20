import type { TripStayItem, TripTransportItem } from "@/types/trip-logistics";

export type MembershipStatus = "basic" | "pro";

export type TripRole = "owner" | "editor" | "pending";

export type TransportMode = "transit" | "drive";

export type TripStatus = "active" | "archived" | "deleted";

export type TripCapabilities = {
  isGuest: boolean;
  canManageTransport: boolean;
  canManageStay: boolean;
  canManageDocuments: boolean;
  canUseExpenses: boolean;
  canCollaborate: boolean;
  canCalculateRoutes: boolean;
  canVisitAgain: boolean;
};

export type TripSummary = {
  _id: string;
  name: string;
  description: string;
  centerName: string;
  centerPlaceId: string;
  centerCountryCode: string;
  centerThumbnail: string;
  centerLat: number | null;
  centerLng: number | null;
  createdAt: string;
  travelDates: string[];
  role: TripRole;
  shareCode: string;
  status: TripStatus;
  transportMode: TransportMode;
};

export type TripDocument = {
  _id: string;
  name: string;
  url: string;
};

export type TripMember = {
  userId: string;
  name: string;
  email: string;
  image: string;
  isOwner: boolean;
};

export type TripDetail = {
  _id: string;
  name: string;
  description: string;
  centerName: string;
  centerPlaceId: string;
  centerCountryCode: string;
  centerThumbnail: string;
  shareCode: string;
  role: "owner" | "editor";
  userId: string;
  status: TripStatus;
  documents: TripDocument[];
  membershipStatus: MembershipStatus;
  transportItems: TripTransportItem[];
  stayItems: TripStayItem[];
  capabilities: TripCapabilities;
};

export type NotificationItem = {
  planId: string;
  planName: string;
  userId: string;
  name: string;
  email: string;
  requestedAt: string;
};

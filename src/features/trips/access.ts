import "server-only";

import type { TripCapabilities } from "@/types/travel";

export type TripActor =
  | { kind: "user"; userId: string }
  | { kind: "guest"; guestId: string };

export type TripAccessRecord = {
  userId?: string;
  guestId?: string | null;
  ownerType?: "user" | "guest";
  editors?: string[];
  status?: string;
};

export function canActorAccessTrip(trip: TripAccessRecord, actor: TripActor) {
  if ((trip.ownerType ?? "user") === "guest") {
    return actor.kind === "guest" && trip.guestId === actor.guestId;
  }

  return (
    actor.kind === "user" &&
    (trip.userId === actor.userId || (trip.editors ?? []).includes(actor.userId))
  );
}

export function buildTripCapabilities(actor: TripActor): TripCapabilities {
  if (actor.kind === "guest") {
    return {
      isGuest: true,
      canManageTransport: false,
      canManageStay: true,
      canManageDocuments: false,
      canUseExpenses: false,
      canCollaborate: false,
      canCalculateRoutes: false,
      canVisitAgain: true,
    };
  }

  return {
    isGuest: false,
    canManageTransport: true,
    canManageStay: true,
    canManageDocuments: true,
    canUseExpenses: true,
    canCollaborate: true,
    canCalculateRoutes: true,
    canVisitAgain: true,
  };
}

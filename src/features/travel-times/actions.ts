"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/features/auth/session";
import {
  TravelTimeServiceError,
  calculateAllTravelTimesForUser,
  calculateTravelTimeForUser,
} from "@/features/travel-times/service";
import type { TravelMode } from "@/lib/routes-api";

export type TravelTimeActionState = {
  error?: string;
};

function getActionError(error: unknown, fallback: string) {
  if (error instanceof TravelTimeServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function parseReturnTo(formData: FormData, tripId: string) {
  const fallback = `/trips/${tripId}/plan`;
  const returnTo = String(formData.get("returnTo") ?? "");
  return returnTo.startsWith(fallback) ? returnTo : fallback;
}

function revalidateTripPlan(tripId: string) {
  revalidatePath(`/trips/${tripId}/plan`);
  revalidatePath(`/plans`);
}

export async function calculateTravelTimeAction(
  _previousState: TravelTimeActionState,
  formData: FormData,
): Promise<TravelTimeActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);

  try {
    await calculateTravelTimeForUser({
      userId,
      planId: tripId,
      fromNodeId: String(formData.get("fromNodeId") ?? ""),
      toNodeId: String(formData.get("toNodeId") ?? ""),
      fromLat: Number(formData.get("fromLat") ?? 0),
      fromLng: Number(formData.get("fromLng") ?? 0),
      toLat: Number(formData.get("toLat") ?? 0),
      toLng: Number(formData.get("toLng") ?? 0),
      toDate: String(formData.get("toDate") ?? ""),
      toTime: String(formData.get("toTime") ?? ""),
      mode: String(formData.get("mode") ?? "TRANSIT") as TravelMode,
    });
  } catch (error) {
    return {
      error: getActionError(error, "Failed to calculate travel time"),
    };
  }

  revalidateTripPlan(tripId);
  redirect(returnTo);
}

export async function calculateAllTravelTimesAction(
  _previousState: TravelTimeActionState,
  formData: FormData,
): Promise<TravelTimeActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);

  try {
    await calculateAllTravelTimesForUser(tripId, userId);
  } catch (error) {
    return {
      error: getActionError(error, "Failed to calculate travel times"),
    };
  }

  revalidateTripPlan(tripId);
  redirect(returnTo);
}

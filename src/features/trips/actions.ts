"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, requireUserId } from "@/features/auth/session";
import { TripServiceError } from "@/features/trips/errors";
import {
  addTripDocumentForUser,
  approveTripRequestForOwner,
  createTripForUser,
  deleteTripForUser,
  denyTripRequestForOwner,
  joinTripForUser,
  removeTripDocumentForUser,
  removeTripMemberForUser,
  updateTripStatusForUser,
} from "@/features/trips/service";
import type { TransportMode } from "@/types/travel";

export type FormActionState = {
  error?: string;
  success?: boolean;
};

function parseNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function revalidateTripPaths(tripId?: string) {
  revalidatePath("/");
  revalidatePath("/trips");
  revalidatePath("/notifications");

  if (tripId) {
    revalidatePath(`/trips/${tripId}`);
    revalidatePath(`/trips/${tripId}/plan`);
    revalidatePath(`/trips/${tripId}/expense`);
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof TripServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function createTripAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const userId = await requireUserId();
  let tripId = "";

  try {
    const trip = await createTripForUser(userId, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      location: String(formData.get("location") ?? ""),
      locationLat: parseNumber(formData.get("locationLat")),
      locationLng: parseNumber(formData.get("locationLng")),
      locationPlaceId: String(formData.get("locationPlaceId") ?? ""),
      locationCountryCode: String(formData.get("locationCountryCode") ?? ""),
      locationThumbnail: String(formData.get("locationThumbnail") ?? ""),
      transportMode:
        String(formData.get("transportMode") ?? "transit") === "drive"
          ? ("drive" as TransportMode)
          : "transit",
    });
    tripId = String(trip._id);
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to create trip") };
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}`);
}

export async function joinTripAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const session = await requireSession();

  try {
    await joinTripForUser(
      session.user.id,
      String(formData.get("shareCode") ?? ""),
      {
        name: session.user.name,
        email: session.user.email,
      },
    );
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to join trip") };
  }

  revalidateTripPaths();
  redirect("/trips");
}

export async function archiveTripAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const nextStatus =
    String(formData.get("status") ?? "archived") === "active"
      ? "active"
      : "archived";

  await updateTripStatusForUser(tripId, userId, nextStatus);
  revalidateTripPaths(tripId);
}

export async function deleteTripAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");

  await deleteTripForUser(tripId, userId);
  revalidateTripPaths(tripId);
  redirect("/trips");
}

export async function removeTripMemberAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");

  await removeTripMemberForUser(tripId, userId, memberId);
  revalidateTripPaths(tripId);
}

export async function addTripDocumentAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");

  try {
    await addTripDocumentForUser(tripId, userId, {
      name: String(formData.get("name") ?? ""),
      url: String(formData.get("url") ?? ""),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to add document") };
  }

  revalidateTripPaths(tripId);
  return { success: true };
}

export async function removeTripDocumentAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");

  await removeTripDocumentForUser(tripId, userId, documentId);
  revalidateTripPaths(tripId);
}

export async function approveTripRequestAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const requesterId = String(formData.get("requesterId") ?? "");

  await approveTripRequestForOwner(tripId, userId, requesterId);
  revalidateTripPaths(tripId);
}

export async function denyTripRequestAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const requesterId = String(formData.get("requesterId") ?? "");

  await denyTripRequestForOwner(tripId, userId, requesterId);
  revalidateTripPaths(tripId);
}

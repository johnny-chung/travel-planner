"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/features/auth/session";
import { TripServiceError } from "@/features/trips/errors";
import {
  addStayForUser,
  addTransportForUser,
  deleteStayForUser,
  deleteTransportForUser,
  updateStayForUser,
  updateTransportForUser,
} from "@/features/trip-logistics/service";

export type TripLogisticsActionState = {
  error?: string;
  success?: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof TripServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function parseNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function revalidateTripPaths(tripId: string) {
  revalidatePath("/");
  revalidatePath("/trips");
  revalidatePath("/plans");
  revalidatePath("/expense");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/plan`);
  revalidatePath(`/trips/${tripId}/expense`);
}

export async function addTransportAction(
  _previousState: TripLogisticsActionState,
  formData: FormData,
): Promise<TripLogisticsActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");

  try {
    await addTransportForUser(tripId, userId, {
      type:
        String(formData.get("type") ?? "flight") === "custom"
          ? "custom"
          : "flight",
      title: String(formData.get("title") ?? ""),
      flightNumber: String(formData.get("flightNumber") ?? ""),
      departureDate: String(formData.get("departureDate") ?? ""),
      departureTime: String(formData.get("departureTime") ?? ""),
      arrivalDate: String(formData.get("arrivalDate") ?? ""),
      arrivalTime: String(formData.get("arrivalTime") ?? ""),
      departureName: String(formData.get("departureName") ?? ""),
      departureAddress: String(formData.get("departureAddress") ?? ""),
      departureLat: parseNumber(formData.get("departureLat")),
      departureLng: parseNumber(formData.get("departureLng")),
      departurePlaceId: String(formData.get("departurePlaceId") ?? ""),
      arrivalName: String(formData.get("arrivalName") ?? ""),
      arrivalAddress: String(formData.get("arrivalAddress") ?? ""),
      arrivalLat: parseNumber(formData.get("arrivalLat")),
      arrivalLng: parseNumber(formData.get("arrivalLng")),
      arrivalPlaceId: String(formData.get("arrivalPlaceId") ?? ""),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to add transport") };
  }

  revalidateTripPaths(tripId);
  return { success: true };
}

export async function updateTransportAction(
  _previousState: TripLogisticsActionState,
  formData: FormData,
): Promise<TripLogisticsActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const transportId = String(formData.get("transportId") ?? "");

  try {
    await updateTransportForUser(tripId, userId, transportId, {
      type:
        String(formData.get("type") ?? "flight") === "custom"
          ? "custom"
          : "flight",
      title: String(formData.get("title") ?? ""),
      flightNumber: String(formData.get("flightNumber") ?? ""),
      departureDate: String(formData.get("departureDate") ?? ""),
      departureTime: String(formData.get("departureTime") ?? ""),
      arrivalDate: String(formData.get("arrivalDate") ?? ""),
      arrivalTime: String(formData.get("arrivalTime") ?? ""),
      departureName: String(formData.get("departureName") ?? ""),
      departureAddress: String(formData.get("departureAddress") ?? ""),
      departureLat: parseNumber(formData.get("departureLat")),
      departureLng: parseNumber(formData.get("departureLng")),
      departurePlaceId: String(formData.get("departurePlaceId") ?? ""),
      arrivalName: String(formData.get("arrivalName") ?? ""),
      arrivalAddress: String(formData.get("arrivalAddress") ?? ""),
      arrivalLat: parseNumber(formData.get("arrivalLat")),
      arrivalLng: parseNumber(formData.get("arrivalLng")),
      arrivalPlaceId: String(formData.get("arrivalPlaceId") ?? ""),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to update transport") };
  }

  revalidateTripPaths(tripId);
  return { success: true };
}

export async function deleteTransportAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const transportId = String(formData.get("transportId") ?? "");

  await deleteTransportForUser(tripId, userId, transportId);
  revalidateTripPaths(tripId);
}

export async function addStayAction(
  _previousState: TripLogisticsActionState,
  formData: FormData,
): Promise<TripLogisticsActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");

  try {
    await addStayForUser(tripId, userId, {
      name: String(formData.get("name") ?? ""),
      address: String(formData.get("address") ?? ""),
      placeId: String(formData.get("placeId") ?? ""),
      lat: Number(formData.get("lat") ?? 0),
      lng: Number(formData.get("lng") ?? 0),
      checkInDate: String(formData.get("checkInDate") ?? ""),
      checkOutDate: String(formData.get("checkOutDate") ?? ""),
      thumbnail: String(formData.get("thumbnail") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to add stay") };
  }

  revalidateTripPaths(tripId);
  return { success: true };
}

export async function updateStayAction(
  _previousState: TripLogisticsActionState,
  formData: FormData,
): Promise<TripLogisticsActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const stayId = String(formData.get("stayId") ?? "");

  try {
    await updateStayForUser(tripId, userId, stayId, {
      name: String(formData.get("name") ?? ""),
      address: String(formData.get("address") ?? ""),
      placeId: String(formData.get("placeId") ?? ""),
      lat: Number(formData.get("lat") ?? 0),
      lng: Number(formData.get("lng") ?? 0),
      checkInDate: String(formData.get("checkInDate") ?? ""),
      checkOutDate: String(formData.get("checkOutDate") ?? ""),
      thumbnail: String(formData.get("thumbnail") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to update stay") };
  }

  revalidateTripPaths(tripId);
  return { success: true };
}

export async function deleteStayAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const stayId = String(formData.get("stayId") ?? "");

  await deleteStayForUser(tripId, userId, stayId);
  revalidateTripPaths(tripId);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrCreateGuestId } from "@/features/guest/session";
import {
  createTrialTripForGuest,
  TripServiceError,
} from "@/features/trips/service";
import {
  applyStopSchedulesForGuest,
  createStopForGuest,
  deleteStopForGuest,
  duplicateStopForGuest,
  reorderStopsForGuest,
  StopServiceError,
  updateStopForGuest,
} from "@/features/stops/service";
import {
  addStayForGuest,
  deleteStayForGuest,
  updateStayForGuest,
} from "@/features/trip-logistics/service";
import type { TransportMode } from "@/types/travel";

export type GuestFormActionState = {
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof TripServiceError || error instanceof StopServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function parseTrialReturnTo(formData: FormData, tripId: string) {
  const fallback = `/try/${tripId}/plan`;
  const returnTo = String(formData.get("returnTo") ?? "");
  const pathname = new URL(returnTo || fallback, "https://planner.local")
    .pathname;
  return pathname.endsWith(fallback) ? returnTo : fallback;
}

function parseStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

function parseScheduleFields(formData: FormData) {
  return {
    date: String(formData.get("date") ?? "").trim(),
    time: String(formData.get("time") ?? "").trim(),
  };
}

function parseSchedulePayload(formData: FormData) {
  const raw = String(formData.get("payload") ?? "");
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Array<{
      stopId?: unknown;
      date?: unknown;
      time?: unknown;
      sequence?: unknown;
    }>;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => ({
        stopId: typeof entry.stopId === "string" ? entry.stopId : "",
        date: typeof entry.date === "string" ? entry.date : "",
        time: typeof entry.time === "string" ? entry.time : "",
        sequence:
          typeof entry.sequence === "number" && Number.isFinite(entry.sequence)
            ? entry.sequence
            : 0,
      }))
      .filter((entry) => entry.stopId);
  } catch {
    return [];
  }
}

function revalidateTrialPaths(tripId?: string) {
  revalidatePath("/");
  revalidatePath("/try");
  if (tripId) {
    revalidatePath(`/try/${tripId}`);
    revalidatePath(`/try/${tripId}/plan`);
  }
}

export async function createTrialTripAction(
  _previousState: GuestFormActionState,
  formData: FormData,
): Promise<GuestFormActionState> {
  const guestId = await getOrCreateGuestId();

  try {
    const trip = await createTrialTripForGuest(guestId, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      location: String(formData.get("location") ?? ""),
      locationLat: parseNumber(formData.get("locationLat")),
      locationLng: parseNumber(formData.get("locationLng")),
      locationPlaceId: String(formData.get("locationPlaceId") ?? ""),
      locationCountryCode: String(formData.get("locationCountryCode") ?? ""),
      locationThumbnail: String(formData.get("locationThumbnail") ?? ""),
      travelDateFrom: String(formData.get("travelDateFrom") ?? ""),
      travelDateTo: String(formData.get("travelDateTo") ?? ""),
      transportMode:
        String(formData.get("transportMode") ?? "transit") === "drive"
          ? ("drive" as TransportMode)
          : "transit",
    });

    revalidateTrialPaths(String(trip._id));
    redirect(`/try/${String(trip._id)}/plan`);
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to create trip") };
  }
}

export async function createGuestStopAction(
  _previousState: GuestFormActionState,
  formData: FormData,
): Promise<GuestFormActionState> {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseTrialReturnTo(formData, tripId);

  try {
    await createStopForGuest(tripId, guestId, {
      name: String(formData.get("name") ?? ""),
      address: String(formData.get("address") ?? ""),
      lat: Number(formData.get("lat") ?? 0),
      lng: Number(formData.get("lng") ?? 0),
      placeId: String(formData.get("placeId") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      openingHours: parseStringList(formData, "openingHours"),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
      thumbnail: String(formData.get("thumbnail") ?? ""),
      linkedDocIds: [],
      ...parseScheduleFields(formData),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to create stop") };
  }

  revalidateTrialPaths(tripId);
  redirect(returnTo);
}

export async function updateGuestStopAction(
  _previousState: GuestFormActionState,
  formData: FormData,
): Promise<GuestFormActionState> {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const stopId = String(formData.get("stopId") ?? "");
  const returnTo = parseTrialReturnTo(formData, tripId);

  const [rawSchedule = "|"] = parseStringList(formData, "arrivals");
  const [date = "", time = ""] = rawSchedule.split("|");

  try {
    await updateStopForGuest(tripId, stopId, guestId, {
      notes: String(formData.get("notes") ?? ""),
      linkedDocIds: [],
      date,
      time,
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to update stop") };
  }

  revalidateTrialPaths(tripId);
  redirect(returnTo);
}

export async function deleteGuestStopAction(formData: FormData) {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const stopId = String(formData.get("stopId") ?? "");
  const returnTo = parseTrialReturnTo(formData, tripId);

  await deleteStopForGuest(tripId, stopId, guestId);
  revalidateTrialPaths(tripId);
  redirect(returnTo);
}

export async function duplicateGuestStopAction(
  _previousState: GuestFormActionState,
  formData: FormData,
): Promise<GuestFormActionState> {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const stopId = String(formData.get("stopId") ?? "");
  const returnTo = parseTrialReturnTo(formData, tripId);

  try {
    await duplicateStopForGuest(tripId, stopId, guestId, parseScheduleFields(formData));
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to add another visit") };
  }

  revalidateTrialPaths(tripId);
  redirect(returnTo);
}

export async function reorderGuestStopsAction(formData: FormData) {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseTrialReturnTo(formData, tripId);
  const stopIds = parseStringList(formData, "stopIds");

  await reorderStopsForGuest(tripId, guestId, stopIds);
  revalidateTrialPaths(tripId);
  redirect(returnTo);
}

export async function applyGuestStopSchedulesAction(formData: FormData) {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseTrialReturnTo(formData, tripId);
  const schedules = parseSchedulePayload(formData);

  await applyStopSchedulesForGuest(tripId, guestId, schedules);
  revalidateTrialPaths(tripId);
  redirect(returnTo);
}

export async function addGuestStayAction(
  _previousState: GuestFormActionState,
  formData: FormData,
): Promise<GuestFormActionState> {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");

  try {
    await addStayForGuest(tripId, guestId, {
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

  revalidateTrialPaths(tripId);
  return { success: true };
}

export async function updateGuestStayAction(
  _previousState: GuestFormActionState,
  formData: FormData,
): Promise<GuestFormActionState> {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const stayId = String(formData.get("stayId") ?? "");

  try {
    await updateStayForGuest(tripId, guestId, stayId, {
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

  revalidateTrialPaths(tripId);
  return { success: true };
}

export async function deleteGuestStayAction(formData: FormData) {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const stayId = String(formData.get("stayId") ?? "");

  await deleteStayForGuest(tripId, guestId, stayId);
  revalidateTrialPaths(tripId);
}

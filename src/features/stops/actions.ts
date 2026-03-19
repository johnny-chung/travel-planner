"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/features/auth/session";
import {
  applyStopSchedulesForUser,
  StopServiceError,
  addArrivalToStopForUser,
  createStopForUser,
  deleteStopForUser,
  removeArrivalFromStopForUser,
  reorderStopsForUser,
  updateStopForUser,
} from "@/features/stops/service";

export type StopFormActionState = {
  error?: string;
};

function getActionError(error: unknown, fallback: string) {
  if (error instanceof StopServiceError) {
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

function parseStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

function parseArrivals(formData: FormData) {
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();

  if (!date) {
    return [];
  }

  return [{ date, time }];
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

function revalidateTripPlan(tripId: string) {
  revalidatePath(`/trips/${tripId}/plan`);
  revalidatePath(`/plans`);
}

export async function createStopAction(
  _previousState: StopFormActionState,
  formData: FormData,
): Promise<StopFormActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);

  try {
    await createStopForUser(tripId, userId, {
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
      linkedDocIds: parseStringList(formData, "linkedDocIds"),
      arrivals: parseArrivals(formData),
    });
  } catch (error) {
    return {
      error: getActionError(error, "Failed to create stop"),
    };
  }

  revalidateTripPlan(tripId);
  redirect(returnTo);
}

export async function updateStopAction(
  _previousState: StopFormActionState,
  formData: FormData,
): Promise<StopFormActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const stopId = String(formData.get("stopId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);

  const arrivals = parseStringList(formData, "arrivals").map((entry) => {
    const [date = "", time = ""] = entry.split("|");
    return { date, time };
  });

  try {
    await updateStopForUser(tripId, stopId, userId, {
      notes: String(formData.get("notes") ?? ""),
      linkedDocIds: parseStringList(formData, "linkedDocIds"),
      arrivals,
    });
  } catch (error) {
    return {
      error: getActionError(error, "Failed to update stop"),
    };
  }

  revalidateTripPlan(tripId);
  redirect(returnTo);
}

export async function deleteStopAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const stopId = String(formData.get("stopId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);

  await deleteStopForUser(tripId, stopId, userId);
  revalidateTripPlan(tripId);
  redirect(returnTo);
}

export async function addStopArrivalAction(
  _previousState: StopFormActionState,
  formData: FormData,
): Promise<StopFormActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const stopId = String(formData.get("stopId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);

  try {
    await addArrivalToStopForUser(tripId, stopId, userId, {
      date: String(formData.get("date") ?? ""),
      time: String(formData.get("time") ?? ""),
    });
  } catch (error) {
    return {
      error: getActionError(error, "Failed to add arrival"),
    };
  }

  revalidateTripPlan(tripId);
  redirect(returnTo);
}

export async function removeStopArrivalAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const stopId = String(formData.get("stopId") ?? "");
  const arrivalIndex = Number(formData.get("arrivalIndex") ?? -1);
  const returnTo = parseReturnTo(formData, tripId);

  await removeArrivalFromStopForUser(tripId, stopId, userId, arrivalIndex);
  revalidateTripPlan(tripId);
  redirect(returnTo);
}

export async function reorderStopsAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);
  const stopIds = parseStringList(formData, "stopIds");

  await reorderStopsForUser(tripId, userId, stopIds);
  revalidateTripPlan(tripId);
  redirect(returnTo);
}

export async function applyStopSchedulesAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);
  const schedules = parseSchedulePayload(formData);

  await applyStopSchedulesForUser(tripId, userId, schedules);
  revalidateTripPlan(tripId);
  redirect(returnTo);
}

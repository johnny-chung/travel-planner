"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/features/auth/session";
import { getOrCreateGuestId } from "@/features/guest/session";
import {
  createChecklistItemForGuest,
  createChecklistItemForUser,
  deleteChecklistItemForGuest,
  deleteChecklistItemForUser,
  setChecklistItemCompletedForGuest,
  setChecklistItemCompletedForUser,
  updateChecklistItemForGuest,
  updateChecklistItemForUser,
} from "@/features/checklist/service";
import { TripServiceError } from "@/features/trips/errors";

export type ChecklistActionState = {
  error?: string;
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

function parseReturnTo(formData: FormData, tripId: string, accessMode: "user" | "guest") {
  const fallback =
    accessMode === "guest"
      ? `/try/${tripId}/checklist`
      : `/trips/${tripId}/checklist`;
  const returnTo = String(formData.get("returnTo") ?? "");
  return returnTo.startsWith(fallback) ? returnTo : fallback;
}

function revalidateChecklistPaths(tripId: string, accessMode: "user" | "guest") {
  if (accessMode === "guest") {
    revalidatePath(`/try/${tripId}`);
    revalidatePath(`/try/${tripId}/checklist`);
    return;
  }

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/checklist`);
}

export async function createChecklistItemAction(
  _previousState: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseReturnTo(formData, tripId, "user");

  try {
    await createChecklistItemForUser(tripId, userId, {
      text: String(formData.get("text") ?? ""),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to add checklist item") };
  }

  revalidateChecklistPaths(tripId, "user");
  redirect(returnTo);
}

export async function updateChecklistItemAction(
  _previousState: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const returnTo = parseReturnTo(formData, tripId, "user");

  try {
    await updateChecklistItemForUser(tripId, itemId, userId, {
      text: String(formData.get("text") ?? ""),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to update checklist item") };
  }

  revalidateChecklistPaths(tripId, "user");
  redirect(returnTo);
}

export async function toggleChecklistItemAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const returnTo = parseReturnTo(formData, tripId, "user");
  const isCompleted = String(formData.get("isCompleted") ?? "") === "1";

  await setChecklistItemCompletedForUser(tripId, itemId, userId, isCompleted);
  revalidateChecklistPaths(tripId, "user");
  redirect(returnTo);
}

export async function deleteChecklistItemAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const returnTo = parseReturnTo(formData, tripId, "user");

  await deleteChecklistItemForUser(tripId, itemId, userId);
  revalidateChecklistPaths(tripId, "user");
  redirect(returnTo);
}

export async function createGuestChecklistItemAction(
  _previousState: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseReturnTo(formData, tripId, "guest");

  try {
    await createChecklistItemForGuest(tripId, guestId, {
      text: String(formData.get("text") ?? ""),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to add checklist item") };
  }

  revalidateChecklistPaths(tripId, "guest");
  redirect(returnTo);
}

export async function updateGuestChecklistItemAction(
  _previousState: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const returnTo = parseReturnTo(formData, tripId, "guest");

  try {
    await updateChecklistItemForGuest(tripId, itemId, guestId, {
      text: String(formData.get("text") ?? ""),
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to update checklist item") };
  }

  revalidateChecklistPaths(tripId, "guest");
  redirect(returnTo);
}

export async function toggleGuestChecklistItemAction(formData: FormData) {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const returnTo = parseReturnTo(formData, tripId, "guest");
  const isCompleted = String(formData.get("isCompleted") ?? "") === "1";

  await setChecklistItemCompletedForGuest(tripId, itemId, guestId, isCompleted);
  revalidateChecklistPaths(tripId, "guest");
  redirect(returnTo);
}

export async function deleteGuestChecklistItemAction(formData: FormData) {
  const guestId = await getOrCreateGuestId();
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const returnTo = parseReturnTo(formData, tripId, "guest");

  await deleteChecklistItemForGuest(tripId, itemId, guestId);
  revalidateChecklistPaths(tripId, "guest");
  redirect(returnTo);
}

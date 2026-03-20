"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/features/auth/session";
import {
  addExpenseForUser,
  deleteExpenseForUser,
  ExpenseServiceError,
} from "@/features/expense/service";

export type ExpenseActionState = {
  error?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ExpenseServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function parseReturnTo(formData: FormData, tripId: string) {
  const fallback = `/trips/${tripId}/expense`;
  const returnTo = String(formData.get("returnTo") ?? "");
  return returnTo.startsWith(fallback) ? returnTo : fallback;
}

function revalidateExpensePaths(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/expense`);
  revalidatePath("/expense");
}

export async function createExpenseAction(
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);
  const amount = Number(formData.get("amount") ?? 0);

  try {
    await addExpenseForUser(tripId, userId, {
      description: String(formData.get("description") ?? ""),
      date: String(formData.get("date") ?? ""),
      amount,
      currency: String(formData.get("currency") ?? "CAD"),
      type: String(formData.get("type") ?? "shared") === "own" ? "own" : "shared",
    });
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to add expense") };
  }

  revalidateExpensePaths(tripId);
  redirect(returnTo);
}

export async function deleteExpenseAction(formData: FormData) {
  const userId = await requireUserId();
  const tripId = String(formData.get("tripId") ?? "");
  const expenseId = String(formData.get("expenseId") ?? "");
  const returnTo = parseReturnTo(formData, tripId);

  await deleteExpenseForUser(tripId, userId, expenseId);
  revalidateExpensePaths(tripId);
  redirect(returnTo);
}

import "server-only";

import { connectDB } from "@/lib/mongodb";
import { Expense } from "@/lib/models/Expense";
import { Trip } from "@/lib/models/Trip";
import { User } from "@/lib/models/User";
import type { ExpenseItem, ExpenseMember } from "@/features/expense/types";

type TripAccessRecord = {
  _id: unknown;
  userId: string;
  name: string;
  editors?: string[];
  status?: string;
};

type ExpenseRecord = {
  _id: unknown;
  tripId: string;
  addedBy: string;
  description: string;
  date: string;
  amount: number;
  currency?: string;
  type?: "shared" | "own";
  createdAt?: Date | string;
};

export class ExpenseServiceError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

function canAccessTrip(trip: TripAccessRecord, userId: string) {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

async function getAccessibleTrip(tripId: string, userId: string, allowArchived = true) {
  await connectDB();

  const trip = (await Trip.findOne({ _id: tripId }).lean()) as TripAccessRecord | null;
  if (!trip || !canAccessTrip(trip, userId)) {
    throw new ExpenseServiceError("NOT_FOUND", "Trip not found");
  }

  if (!allowArchived && trip.status === "archived") {
    throw new ExpenseServiceError("ARCHIVED", "Trip is archived");
  }

  return trip;
}

function serializeExpense(expense: ExpenseRecord): ExpenseItem {
  return {
    _id: String(expense._id),
    tripId: expense.tripId,
    addedBy: expense.addedBy,
    description: expense.description,
    date: expense.date,
    amount: Number(expense.amount),
    currency: expense.currency ?? "CAD",
    type: expense.type === "own" ? "own" : "shared",
    createdAt:
      expense.createdAt instanceof Date
        ? expense.createdAt.toISOString()
        : String(expense.createdAt ?? ""),
  };
}

export async function getExpensePageDataForUser(input: {
  tripId: string;
  userId: string;
  from?: string;
  to?: string;
}) {
  const trip = await getAccessibleTrip(input.tripId, input.userId);

  const dateFilter: Record<string, unknown> = {};
  if (input.from || input.to) {
    dateFilter.date = {};
    if (input.from) {
      (dateFilter.date as Record<string, string>).$gte = input.from;
    }
    if (input.to) {
      (dateFilter.date as Record<string, string>).$lte = input.to;
    }
  }

  const memberIds = [trip.userId, ...(trip.editors ?? [])];

  // Fetch members and filtered expenses in parallel to avoid a server waterfall.
  const [users, expenses] = await Promise.all([
    User.find({ userId: { $in: memberIds } }).lean() as Promise<
      Array<{ userId: string; name: string; email: string; image: string }>
    >,
    Expense.find({ tripId: input.tripId, ...dateFilter })
      .sort({ date: -1, createdAt: -1 })
      .lean() as Promise<ExpenseRecord[]>,
  ]);

  const members: ExpenseMember[] = memberIds.map((memberId) => {
    const user = users.find((candidate) => candidate.userId === memberId);
    return {
      userId: memberId,
      name: user?.name ?? memberId,
      email: user?.email ?? "",
      image: user?.image ?? "",
    };
  });

  return {
    tripId: String(trip._id),
    tripName: trip.name,
    members,
    expenses: expenses.map(serializeExpense),
  };
}

export async function addExpenseForUser(
  tripId: string,
  userId: string,
  input: {
    description: string;
    date: string;
    amount: number;
    currency?: string;
    type?: "shared" | "own";
  },
) {
  await getAccessibleTrip(tripId, userId, false);

  const description = input.description.trim();
  if (!description || !input.date || !Number.isFinite(input.amount)) {
    throw new ExpenseServiceError("INVALID", "Missing required fields");
  }

  await Expense.create({
    tripId,
    addedBy: userId,
    description,
    date: input.date,
    amount: input.amount,
    currency: input.currency ?? "CAD",
    type: input.type === "own" ? "own" : "shared",
  });
}

export async function deleteExpenseForUser(
  tripId: string,
  userId: string,
  expenseId: string,
) {
  await getAccessibleTrip(tripId, userId, false);
  await Expense.findOneAndDelete({ _id: expenseId, tripId });
}

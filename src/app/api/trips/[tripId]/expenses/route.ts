import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Trip";
import { Expense } from "@/lib/models/Expense";

type Params = { params: Promise<{ tripId: string }> };

function canAccess(trip: { userId: string; editors?: string[] }, userId: string) {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[] } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const dateFilter: Record<string, unknown> = {};
  if (from || to) {
    dateFilter.date = {};
    if (from) (dateFilter.date as Record<string, string>).$gte = from;
    if (to) (dateFilter.date as Record<string, string>).$lte = to;
  }

  const expenses = await Expense.find({ tripId, ...dateFilter }).sort({ date: -1, createdAt: -1 }).lean();
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[]; status?: string } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((trip as { userId: string; editors?: string[]; status?: string }).status === 'archived') {
    return NextResponse.json({ error: 'Trip is archived' }, { status: 403 });
  }

  const { description, date, amount, currency, type } = await req.json();
  if (!description?.trim() || !date || typeof amount !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const expense = await Expense.create({
    tripId, addedBy: session.user.id, description: description.trim(), date, amount,
    currency: currency ?? "CAD",
    type: type === "own" ? "own" : "shared",
  });
  return NextResponse.json(expense, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  const { searchParams } = new URL(req.url);
  const expenseId = searchParams.get("expenseId");
  if (!expenseId) return NextResponse.json({ error: "expenseId required" }, { status: 400 });
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[]; status?: string } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((trip as { userId: string; editors?: string[]; status?: string }).status === 'archived') {
    return NextResponse.json({ error: 'Trip is archived' }, { status: 403 });
  }
  await Expense.findOneAndDelete({ _id: expenseId, tripId });
  return NextResponse.json({ success: true });
}

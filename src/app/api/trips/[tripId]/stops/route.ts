import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { syncTripTravelDates } from "@/features/trips/travel-dates";
import { Stop } from "@/lib/models/Stop";
import { Trip } from "@/lib/models/Trip";
import { serializeStop, serializeStops } from "@/features/stops/serialization";

type Params = { params: Promise<{ tripId: string }> };

function canAccess(trip: { userId: string; editors?: string[] }, userId: string): boolean {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId } = await params;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  await connectDB();
  const trip = (await Trip.findOne({ _id: tripId }).lean()) as
    | { userId: string; editors?: string[] }
    | null;
  if (!trip || !canAccess(trip, session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filter: Record<string, unknown> = { planId: tripId };
  if (from || to) {
    filter.status = "scheduled";
    if (from || to) {
      filter.date = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }
  }

  const stops = await Stop.find(filter).sort({ sequence: 1, createdAt: 1 }).lean();
  return NextResponse.json(serializeStops(stops));
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId } = await params;
  try {
    await connectDB();
    const trip = (await Trip.findOne({ _id: tripId }).lean()) as
      | { userId: string; editors?: string[]; status?: string }
      | null;
    if (!trip || !canAccess(trip, session.user.id)) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    if (trip.status === "archived") {
      return NextResponse.json({ error: "Trip is archived" }, { status: 403 });
    }

    const body = await req.json();
    const sequence =
      ((await Stop.findOne({ planId: tripId }).sort({ sequence: -1 }).select("sequence").lean()) as {
        sequence?: number;
      } | null)?.sequence ?? 0;

    const status = typeof body.date === "string" && body.date.trim() ? "scheduled" : "unscheduled";
    const stop = await Stop.create({
      ...body,
      planId: tripId,
      userId: session.user.id,
      status,
      date: status === "scheduled" ? body.date : "",
      time: status === "scheduled" ? String(body.time ?? "") : "",
      displayTime: status === "scheduled" ? Boolean(String(body.time ?? "").trim()) : false,
      sequence: sequence + 1,
    });
    await syncTripTravelDates(tripId);
    return NextResponse.json(serializeStop(stop.toObject(), 1), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create stop", detail: String(err) }, { status: 500 });
  }
}

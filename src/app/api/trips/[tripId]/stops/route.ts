import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { syncTripTravelDates } from "@/features/trips/travel-dates";
import { Stop } from "@/lib/models/Stop";
import { Trip } from "@/lib/models/Trip";
import { serializeStop, serializeStops } from "@/features/stops/serialization";

type Params = { params: Promise<{ tripId: string }> };
type ArrivalEntry = { date: string; time: string };

function canAccess(trip: { userId: string; editors?: string[] }, userId: string): boolean {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[] } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const filter: Record<string, unknown> = { planId: tripId };
  if (from || to) {
    const match: Record<string, unknown> = {};
    if (from) match.date = { $gte: from };
    if (to) match.date = { ...(match.date as object ?? {}), $lte: to };
    filter.arrivals = { $elemMatch: match };
  }
  const stops = await Stop.find(filter)
    .sort({ "arrivals.0.date": 1, "arrivals.0.time": 1 })
    .lean();
  return NextResponse.json(serializeStops(stops));
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  try {
    await connectDB();
    const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[]; status?: string } | null;
    if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    if ((trip as { status?: string }).status === 'archived') {
      return NextResponse.json({ error: 'Trip is archived' }, { status: 403 });
    }
    const body = await req.json();
    const arrivals: ArrivalEntry[] = Array.isArray(body.arrivals) && body.arrivals.length > 0
      ? body.arrivals
      : [{ date: body.date, time: body.time }];
    const stop = await Stop.create({ ...body, planId: tripId, userId: session.user.id, arrivals });
    await syncTripTravelDates(tripId);
    return NextResponse.json(serializeStop(stop.toObject(), 1), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create stop", detail: String(err) }, { status: 500 });
  }
}

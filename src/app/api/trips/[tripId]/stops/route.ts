import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Stop } from "@/lib/models/Stop";
import { Trip } from "@/lib/models/Plan";

type Params = { params: Promise<{ tripId: string }> };

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
  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.date = { ...(dateFilter.date as object ?? {}), $gte: from };
  if (to) dateFilter.date = { ...(dateFilter.date as object ?? {}), $lte: to };
  const stops = await Stop.find({ planId: tripId, ...dateFilter }).sort({ date: 1, time: 1 }).lean();
  return NextResponse.json(stops);
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
    const stop = await Stop.create({ ...body, planId: tripId, userId: session.user.id });
    return NextResponse.json(stop, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create stop", detail: String(err) }, { status: 500 });
  }
}

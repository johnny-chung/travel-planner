import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Stop } from "@/lib/models/Stop";
import { Trip } from "@/lib/models/Plan";

type Params = { params: Promise<{ tripId: string; stopId: string }> };

function canAccess(trip: { userId: string; editors?: string[] }, userId: string): boolean {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId, stopId } = await params;
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[] } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const stop = await Stop.findOne({ _id: stopId }).lean();
  if (!stop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(stop);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId, stopId } = await params;
  const body = await req.json();
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[] } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const stop = await Stop.findByIdAndUpdate(stopId, body, { new: true }).lean();
  if (!stop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(stop);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId, stopId } = await params;
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[]; status?: string } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.status === 'archived') return NextResponse.json({ error: 'Trip is archived' }, { status: 403 });
  await Stop.findByIdAndDelete(stopId);
  return NextResponse.json({ success: true });
}

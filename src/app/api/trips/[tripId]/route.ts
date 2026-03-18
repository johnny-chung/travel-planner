import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";
import { Stop } from "@/lib/models/Stop";

type Params = { params: Promise<{ tripId: string }> };

function canAccess(trip: { userId: string; editors?: string[] }, userId: string): boolean {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[] } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trip);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  const body = await req.json();
  const { name, description, status } = body;
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[] } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updateFields: Record<string, unknown> = {};
  if (name !== undefined) updateFields.name = name;
  if (description !== undefined) updateFields.description = description;
  if (status !== undefined) updateFields.status = status;
  const updated = await Trip.findByIdAndUpdate(tripId, updateFields, { new: true }).lean();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  await connectDB();
  await Trip.findOneAndDelete({ _id: tripId, userId: session.user.id });
  await Stop.deleteMany({ planId: tripId });
  return NextResponse.json({ success: true });
}

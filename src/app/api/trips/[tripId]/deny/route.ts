import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";

type Params = { params: Promise<{ tripId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  const { userId } = await req.json();
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId, userId: session.user.id });
  if (!trip) return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });
  const pendingIdx = trip.pendingEditors.findIndex((e: { userId: string }) => e.userId === userId);
  if (pendingIdx === -1) return NextResponse.json({ error: "Not in pending list" }, { status: 404 });
  trip.pendingEditors.splice(pendingIdx, 1);
  await trip.save();
  return NextResponse.json({ success: true });
}

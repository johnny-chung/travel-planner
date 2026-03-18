import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";

type Params = { params: Promise<{ tripId: string; memberId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId, memberId } = await params;
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  if (trip.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  trip.editors = (trip.editors ?? []).filter((id: string) => id !== memberId);
  trip.pendingEditors = (trip.pendingEditors ?? []).filter((e: { userId: string }) => e.userId !== memberId);
  await trip.save();
  return NextResponse.json({ success: true });
}

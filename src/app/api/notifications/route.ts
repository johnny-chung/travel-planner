import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const trips = await Trip.find({
    userId: session.user.id,
    "pendingEditors.0": { $exists: true },
  }).lean() as Array<{ _id: unknown; name: string; pendingEditors: Array<{ userId: string; name: string; email: string; requestedAt: Date }> }>;
  const notifications = trips.flatMap(trip =>
    trip.pendingEditors.map(pe => ({
      planId: String(trip._id),
      planName: trip.name,
      userId: pe.userId,
      name: pe.name,
      email: pe.email,
      requestedAt: pe.requestedAt,
    }))
  );
  return NextResponse.json(notifications);
}
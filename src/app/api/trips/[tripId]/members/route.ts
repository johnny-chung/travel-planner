import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Trip";
import { User } from "@/lib/models/User";

type Params = { params: Promise<{ tripId: string }> };

function canAccess(trip: { userId: string; editors?: string[] }, userId: string) {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[]; name?: string } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberIds = [trip.userId, ...(trip.editors ?? [])];
  const users = await User.find({ userId: { $in: memberIds } }).lean() as Array<{ userId: string; name: string; email: string; image: string }>;
  
  const members = memberIds.map(uid => {
    const u = users.find(u => u.userId === uid);
    return { userId: uid, name: u?.name ?? uid, email: u?.email ?? "", image: u?.image ?? "", isOwner: uid === trip.userId };
  });
  
  return NextResponse.json(members);
}

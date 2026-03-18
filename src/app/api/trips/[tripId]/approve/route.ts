import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";
import { User } from "@/lib/models/User";

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

  // Check editor limit for basic plan owners
  const owner = await User.findOne({ userId: session.user.id }).select("membershipStatus").lean();
  const membershipStatus = (owner as { membershipStatus?: string } | null)?.membershipStatus ?? "basic";
  if (membershipStatus === "basic" && trip.editors.length >= 5) {
    return NextResponse.json(
      { error: "LIMIT_REACHED", message: "Basic plan allows up to 5 editors per trip. Upgrade to Pro for unlimited collaborators." },
      { status: 403 }
    );
  }

  trip.pendingEditors.splice(pendingIdx, 1);
  if (!trip.editors.includes(userId)) trip.editors.push(userId);
  await trip.save();
  return NextResponse.json({ success: true });
}

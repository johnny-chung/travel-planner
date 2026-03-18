import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { shareCode } = await req.json();
  if (!shareCode?.trim()) return NextResponse.json({ error: "Share code required" }, { status: 400 });
  await connectDB();
  const trip = await Trip.findOne({ shareCode: shareCode.trim().toUpperCase() });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  if (trip.userId === session.user.id) return NextResponse.json({ error: "You own this trip" }, { status: 400 });
  if (trip.editors?.includes(session.user.id)) return NextResponse.json({ error: "Already an editor" }, { status: 400 });
  if (trip.pendingEditors?.some((e: { userId: string }) => e.userId === session.user.id)) {
    return NextResponse.json({ error: "Already pending approval" }, { status: 400 });
  }
  const user = await User.findOne({ userId: session.user.id }).lean() as { name?: string; email?: string } | null;
  if ((user as { membershipStatus?: string } | null)?.membershipStatus === 'basic') {
    const editorTrips = await Trip.countDocuments({ editors: session.user.id, status: { $ne: 'deleted' } });
    if (editorTrips >= 5) {
      return NextResponse.json(
        { error: 'LIMIT_REACHED', message: 'Basic plan allows editing 5 trips. Upgrade to Pro for unlimited.' },
        { status: 403 }
      );
    }
  }
  trip.pendingEditors.push({
    userId: session.user.id,
    name: user?.name ?? session.user?.name ?? "",
    email: user?.email ?? session.user?.email ?? "",
    requestedAt: new Date(),
  });
  await trip.save();
  return NextResponse.json({ success: true, planName: trip.name });
}

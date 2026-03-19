import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { TravelTime } from "@/lib/models/TravelTime";

function serializeTravelTime(travelTime: Record<string, unknown>) {
  return {
    ...travelTime,
    _id: String(travelTime._id ?? ""),
    planId: String(travelTime.planId ?? ""),
    fromStopId: String(travelTime.fromStopId ?? ""),
    toStopId: String(travelTime.toStopId ?? ""),
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planId = req.nextUrl.searchParams.get("planId");
  if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  await connectDB();
  const times = await TravelTime.find({ planId }).sort({ calculatedAt: -1 }).lean() as Array<Record<string, unknown>>;
  const uniqueTimes = new Map<string, Record<string, unknown>>();
  for (const time of times) {
    const key = `${String(time.fromStopId)}:${String(time.toStopId)}`;
    if (!uniqueTimes.has(key)) {
      uniqueTimes.set(key, time);
    }
  }
  return NextResponse.json([...uniqueTimes.values()].map(serializeTravelTime));
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fromStopId = req.nextUrl.searchParams.get("fromStopId");
  const toStopId = req.nextUrl.searchParams.get("toStopId");
  if (!fromStopId || !toStopId) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  await connectDB();
  await TravelTime.deleteMany({ fromStopId, toStopId });
  return NextResponse.json({ success: true });
}

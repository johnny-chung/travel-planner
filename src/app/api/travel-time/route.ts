import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { TravelTime } from "@/lib/models/TravelTime";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planId = req.nextUrl.searchParams.get("planId");
  if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  await connectDB();
  const times = await TravelTime.find({ planId }).lean();
  return NextResponse.json(times);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fromStopId = req.nextUrl.searchParams.get("fromStopId");
  const toStopId = req.nextUrl.searchParams.get("toStopId");
  if (!fromStopId || !toStopId) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  await connectDB();
  await TravelTime.deleteOne({ fromStopId, toStopId });
  return NextResponse.json({ success: true });
}

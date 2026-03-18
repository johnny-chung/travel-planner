import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Stop } from "@/lib/models/Stop";
import { Plan } from "@/lib/models/Plan";
import { TravelTime } from "@/lib/models/TravelTime";

type Params = { params: Promise<{ planId: string; stopId: string }> };

function canAccess(plan: { userId: string; editors?: string[] }, userId: string): boolean {
  return plan.userId === userId || (plan.editors ?? []).includes(userId);
}

type ArrivalEntry = { date: string; time: string };

function withDerived(s: Record<string, unknown>): Record<string, unknown> {
  const arr = (s.arrivals as ArrivalEntry[]) ?? [];
  return { ...s, date: arr[0]?.date ?? "", time: arr[0]?.time ?? "" };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { planId, stopId } = await params;
  await connectDB();
  const plan = await Plan.findOne({ _id: planId }).lean() as { userId: string; editors?: string[] } | null;
  if (!plan || !canAccess(plan, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const stop = await Stop.findOne({ _id: stopId }).lean() as Record<string, unknown> | null;
  if (!stop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(withDerived(stop));
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { planId, stopId } = await params;
  const body = await req.json();

  // Build update: if arrivals provided, sort them; else keep existing arrivals but allow other field updates
  let updatedBody = { ...body };
  if (Array.isArray(body.arrivals) && body.arrivals.length > 0) {
    const sorted = [...body.arrivals].sort((a: ArrivalEntry, b: ArrivalEntry) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
    updatedBody = { ...updatedBody, arrivals: sorted };
  }
  // Remove any stale top-level date/time keys (no longer stored in schema)
  delete updatedBody.date;
  delete updatedBody.time;

  await connectDB();
  const plan = await Plan.findOne({ _id: planId }).lean() as { userId: string; editors?: string[] } | null;
  if (!plan || !canAccess(plan, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If arrivals are changing, invalidate travel times for this stop
  if (updatedBody.arrivals !== undefined) {
    await TravelTime.deleteMany({ $or: [{ fromStopId: stopId }, { toStopId: stopId }] });
  }

  const stop = await Stop.findByIdAndUpdate(stopId, updatedBody, { new: true }).lean() as Record<string, unknown> | null;
  if (!stop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(withDerived(stop));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { planId, stopId } = await params;
  await connectDB();
  const plan = await Plan.findOne({ _id: planId }).lean() as { userId: string; editors?: string[] } | null;
  if (!plan || !canAccess(plan, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await Stop.findByIdAndDelete(stopId);
  await TravelTime.deleteMany({ $or: [{ fromStopId: stopId }, { toStopId: stopId }] });
  return NextResponse.json({ success: true });
}
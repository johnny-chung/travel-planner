import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Stop } from "@/lib/models/Stop";
import { Plan } from "@/lib/models/Plan";

type Params = { params: Promise<{ planId: string }> };

function canAccess(plan: { userId: string; editors?: string[] }, userId: string): boolean {
  return plan.userId === userId || (plan.editors ?? []).includes(userId);
}

type ArrivalEntry = { date: string; time: string };

/** Add derived date/time from arrivals[0] for client compatibility */
function withDerived(s: Record<string, unknown>): Record<string, unknown> {
  const arr = (s.arrivals as ArrivalEntry[]) ?? [];
  return { ...s, date: arr[0]?.date ?? "", time: arr[0]?.time ?? "" };
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { planId } = await params;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  await connectDB();
  const plan = await Plan.findOne({ _id: planId }).lean() as { userId: string; editors?: string[] } | null;
  if (!plan || !canAccess(plan, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filter: Record<string, unknown> = { planId };
  if (from || to) {
    const match: Record<string, unknown> = {};
    if (from) match.date = { $gte: from };
    if (to) match.date = { ...(match.date as object ?? {}), $lte: to };
    filter.arrivals = { $elemMatch: match };
  }

  const stops = await Stop.find(filter).sort({ "arrivals.0.date": 1, "arrivals.0.time": 1 }).lean() as Record<string, unknown>[];
  return NextResponse.json(stops.map(withDerived));
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    console.error("[POST /api/plans/[planId]/stops] No session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { planId } = await params;

  try {
    await connectDB();
    const plan = await Plan.findOne({ _id: planId }).lean() as { userId: string; editors?: string[] } | null;
    if (!plan || !canAccess(plan, session.user.id)) {
      console.error("[POST stops] Plan not found or no access:", planId, "user:", session.user.id);
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const body = await req.json();
    // Ensure arrivals is always set; body may include top-level date/time for backward compat
    const arrivals: ArrivalEntry[] = body.arrivals?.length
      ? body.arrivals
      : [{ date: body.date, time: body.time }];

    const stop = await Stop.create({
      ...body,
      planId,
      userId: session.user.id,
      arrivals,
    });
    console.log("[POST stops] Created stop:", stop._id, "plan:", planId);
    const plain = stop.toObject() as Record<string, unknown>;
    return NextResponse.json(withDerived(plain), { status: 201 });
  } catch (err) {
    console.error("[POST stops] DB error:", err);
    return NextResponse.json({ error: "Failed to create stop", detail: String(err) }, { status: 500 });
  }
}
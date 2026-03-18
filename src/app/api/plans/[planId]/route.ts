import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Plan } from "@/lib/models/Plan";
import { Stop } from "@/lib/models/Stop";

type Params = { params: Promise<{ planId: string }> };

function canAccess(plan: { userId: string; editors?: string[] }, userId: string): boolean {
  return plan.userId === userId || (plan.editors ?? []).includes(userId);
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { planId } = await params;
  await connectDB();
  const plan = await Plan.findOne({ _id: planId }).lean() as { userId: string; editors?: string[] } | null;
  if (!plan || !canAccess(plan, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { planId } = await params;
  const { name, description } = await req.json();
  await connectDB();
  const plan = await Plan.findOne({ _id: planId }).lean() as { userId: string; editors?: string[] } | null;
  if (!plan || !canAccess(plan, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await Plan.findByIdAndUpdate(planId, { name, description }, { new: true }).lean();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { planId } = await params;
  await connectDB();
  await Plan.findOneAndDelete({ _id: planId, userId: session.user.id });
  await Stop.deleteMany({ planId });
  return NextResponse.json({ success: true });
}
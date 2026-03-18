import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Plan } from "@/lib/models/Plan";

type Params = { params: Promise<{ planId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { planId } = await params;
  const { userId } = await req.json();

  await connectDB();
  const plan = await Plan.findOne({ _id: planId, userId: session.user.id });
  if (!plan) return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });

  const pendingIdx = plan.pendingEditors.findIndex((e: { userId: string }) => e.userId === userId);
  if (pendingIdx === -1) return NextResponse.json({ error: "Not in pending list" }, { status: 404 });

  plan.pendingEditors.splice(pendingIdx, 1);
  if (!plan.editors.includes(userId)) plan.editors.push(userId);
  await plan.save();

  return NextResponse.json({ success: true });
}
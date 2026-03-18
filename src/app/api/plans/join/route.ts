import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Plan } from "@/lib/models/Plan";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shareCode } = await req.json();
  if (!shareCode?.trim()) return NextResponse.json({ error: "Share code required" }, { status: 400 });

  await connectDB();
  const plan = await Plan.findOne({ shareCode: shareCode.trim().toUpperCase() });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  if (plan.userId === session.user.id) return NextResponse.json({ error: "You own this plan" }, { status: 400 });

  if (plan.editors?.includes(session.user.id)) return NextResponse.json({ error: "Already an editor" }, { status: 400 });

  if (plan.pendingEditors?.some((e: { userId: string }) => e.userId === session.user.id)) {
    return NextResponse.json({ error: "Already pending approval" }, { status: 400 });
  }

  const user = await User.findOne({ userId: session.user.id }).lean() as { name?: string; email?: string } | null;

  plan.pendingEditors.push({
    userId: session.user.id,
    name: user?.name ?? session.user?.name ?? "",
    email: user?.email ?? session.user?.email ?? "",
    requestedAt: new Date(),
  });
  await plan.save();

  return NextResponse.json({ success: true, planName: plan.name });
}
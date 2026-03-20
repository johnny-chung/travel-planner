import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { calculateAllTravelTimesForUser } from "@/features/travel-times/service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = (await req.json()) as { planId: string };
  const travelTimes = await calculateAllTravelTimesForUser(planId, session.user.id);
  return NextResponse.json(travelTimes);
}

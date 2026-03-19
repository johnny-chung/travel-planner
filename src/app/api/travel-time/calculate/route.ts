import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { TravelTime } from "@/lib/models/TravelTime";
import { ApiUsage } from "@/lib/models/ApiUsage";
import { UserMonthlyUsage } from "@/lib/models/UserMonthlyUsage";
import { User } from "@/lib/models/User";
import { calculateWithFallback, type TravelMode } from "@/lib/routes-api";

function getYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { planId, fromStopId, toStopId, fromLat, fromLng, toLat, toLng,
          toDate, toTime, mode } = body as {
    planId: string; fromStopId: string; toStopId: string;
    fromLat: number; fromLng: number; toLat: number; toLng: number;
    toDate: string; toTime: string;
    mode: TravelMode;
  };

  await connectDB();

  const yearMonth = getYearMonth();
  const userId = session.user.id;

  // Check global API limit
  const apiUsage = await ApiUsage.findOne({ yearMonth, apiType: "routes" }).lean() as { count?: number } | null;
  if ((apiUsage?.count ?? 0) >= 10000) {
    return NextResponse.json({ error: "GLOBAL_LIMIT", message: "Monthly API limit reached" }, { status: 400 });
  }

  // Get user membership
  const user = await User.findOne({ userId }).lean() as { membershipStatus?: string } | null;
  const isPro = user?.membershipStatus === "pro";

  // Check user monthly limit
  const userUsage = await UserMonthlyUsage.findOne({ userId, yearMonth }).lean() as { commuteCount?: number } | null;
  const commuteLimit = isPro ? 100 : 10;
  if ((userUsage?.commuteCount ?? 0) >= commuteLimit) {
    return NextResponse.json({ error: "USER_LIMIT", message: "Monthly calculation limit reached. Upgrade to Pro for more." }, { status: 429 });
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  // Try requested mode then fall back (TRANSIT→DRIVE→WALK, DRIVE→WALK, WALK)
  const result = await calculateWithFallback(fromLat, fromLng, toLat, toLng, mode, toDate, toTime, apiKey);

  if (!result) {
    return NextResponse.json({ error: "NO_ROUTE", message: "No route found between these stops" }, { status: 422 });
  }

  const { durationMinutes, distanceMeters, summary, details, mode: actualMode } = result;

  await TravelTime.deleteMany({ fromStopId, toStopId });

  const travelTime = await TravelTime.create({
    planId,
    fromStopId,
    toStopId,
    mode: actualMode,
    durationMinutes,
    distanceMeters,
    summary,
    details,
    calculatedAt: new Date(),
  });

  await ApiUsage.findOneAndUpdate(
    { yearMonth, apiType: "routes" },
    { $inc: { count: 1 } },
    { upsert: true }
  );

  await UserMonthlyUsage.findOneAndUpdate(
    { userId, yearMonth },
    { $inc: { commuteCount: 1 } },
    { upsert: true }
  );

  return NextResponse.json({
    ...travelTime.toObject(),
    _id: String(travelTime._id),
    planId: String(travelTime.planId),
    fromStopId: String(travelTime.fromStopId),
    toStopId: String(travelTime.toStopId),
  });
}

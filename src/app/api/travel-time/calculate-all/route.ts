import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { TravelTime } from "@/lib/models/TravelTime";
import { ApiUsage } from "@/lib/models/ApiUsage";
import { UserMonthlyUsage } from "@/lib/models/UserMonthlyUsage";
import { User } from "@/lib/models/User";
import { Stop } from "@/lib/models/Stop";
import { Trip } from "@/lib/models/Plan";
import { calculateWithFallback, type TravelMode } from "@/lib/routes-api";

function getYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

type StopDoc = {
  _id: unknown;
  name: string;
  lat: number;
  lng: number;
  arrivals?: { date: string; time: string }[];
};

type ExpandedStopEntry = {
  stopId: string;
  date: string;
  time: string;
  lat: number;
  lng: number;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json() as { planId: string };
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

  // Load trip to get transportMode
  const trip = await Trip.findById(planId).lean() as { transportMode?: string } | null;
  const rawMode = trip?.transportMode ?? "transit";
  const requestedMode = (rawMode.toUpperCase() === "DRIVE" ? "DRIVE" : rawMode.toUpperCase() === "WALK" ? "WALK" : "TRANSIT") as TravelMode;

  // Load all stops sorted by date, time
  const stops = await Stop.find({ planId }).sort({ "arrivals.0.date": 1, "arrivals.0.time": 1 }).lean() as StopDoc[];

  // Expand multi-arrival stops into one entry per arrival
  const expandedStops: ExpandedStopEntry[] = [];
  for (const stop of stops) {
    const list = (stop.arrivals && stop.arrivals.length > 0) ? stop.arrivals : [];
    for (const arrival of list) {
      expandedStops.push({ stopId: String(stop._id), date: arrival.date, time: arrival.time, lat: stop.lat, lng: stop.lng });
    }
  }
  expandedStops.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  let calculatedCount = 0;

  for (let i = 0; i < expandedStops.length - 1; i++) {
    const fromStop = expandedStops[i];
    const toStop = expandedStops[i + 1];

    if (fromStop.date !== toStop.date) continue;

    const fromStopId = fromStop.stopId;
    const toStopId = toStop.stopId;

    // Skip if already have a result for any mode for this pair
    const existing = await TravelTime.findOne({ fromStopId, toStopId }).lean();
    if (existing) continue;

    const result = await calculateWithFallback(
      fromStop.lat, fromStop.lng,
      toStop.lat, toStop.lng,
      requestedMode,
      toStop.date, toStop.time,
      apiKey
    );
    if (!result) continue;

    const { durationMinutes, mode: actualMode } = result;

    await TravelTime.findOneAndUpdate(
      { fromStopId, toStopId, mode: actualMode },
      { planId, fromStopId, toStopId, mode: actualMode, durationMinutes, calculatedAt: new Date() },
      { upsert: true, new: true }
    );

    calculatedCount++;

    // Increment global API usage per Routes API call
    await ApiUsage.findOneAndUpdate(
      { yearMonth, apiType: "routes" },
      { $inc: { count: 1 } },
      { upsert: true }
    );
  }

  // Increment user monthly usage ONCE for the whole batch
  if (calculatedCount > 0) {
    await UserMonthlyUsage.findOneAndUpdate(
      { userId, yearMonth },
      { $inc: { commuteCount: 1 } },
      { upsert: true }
    );
  }

  // Return all travel times for the plan
  const allTravelTimes = await TravelTime.find({ planId }).lean();
  return NextResponse.json(allTravelTimes);
}

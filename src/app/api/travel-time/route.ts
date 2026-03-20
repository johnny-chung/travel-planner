import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { TravelTime } from "@/lib/models/TravelTime";

function serializeTravelTime(travelTime: Record<string, unknown>) {
  const details = Array.isArray(travelTime.details)
    ? travelTime.details
        .map((detail) => {
          if (!detail || typeof detail !== "object") {
            return null;
          }

          const entry = detail as Record<string, unknown>;
          return {
            type:
              entry.type === "DRIVE" ||
              entry.type === "WALK" ||
              entry.type === "TRANSIT"
                ? entry.type
                : "TRANSIT",
            label: typeof entry.label === "string" ? entry.label : "",
            durationMinutes: Number(entry.durationMinutes ?? 0),
            distanceMeters:
              entry.distanceMeters === null || entry.distanceMeters === undefined
                ? null
                : Number(entry.distanceMeters),
            departureStop:
              typeof entry.departureStop === "string" ? entry.departureStop : "",
            arrivalStop:
              typeof entry.arrivalStop === "string" ? entry.arrivalStop : "",
            lineName: typeof entry.lineName === "string" ? entry.lineName : "",
            headsign: typeof entry.headsign === "string" ? entry.headsign : "",
          };
        })
        .filter(Boolean)
    : [];

  return {
    ...travelTime,
    _id: String(travelTime._id ?? ""),
    planId: String(travelTime.planId ?? ""),
    fromStopId: String(travelTime.fromStopId ?? ""),
    toStopId: String(travelTime.toStopId ?? ""),
    details,
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

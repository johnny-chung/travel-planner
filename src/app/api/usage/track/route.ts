import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { ApiUsage } from "@/lib/models/ApiUsage";

function getYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function POST(req: NextRequest) {
  // Auth is optional — track even if not authed, but don't fail
  await auth().catch(() => {});

  const body = await req.json() as { type?: string };
  const type = body.type;
  if (!type || !["places", "geolocation"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  await connectDB();

  const yearMonth = getYearMonth();
  const updated = await ApiUsage.findOneAndUpdate(
    { yearMonth, apiType: type },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  ).lean() as { count?: number } | null;

  return NextResponse.json({ count: updated?.count ?? 1 });
}

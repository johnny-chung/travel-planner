import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";

type Params = { params: Promise<{ tripId: string }> };

function canAccess(trip: { userId: string; editors?: string[] }, userId: string) {
  return trip.userId === userId || (trip.editors ?? []).includes(userId);
}

// POST /api/trips/[tripId]/documents — add a document link
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  await connectDB();

  const trip = await Trip.findOne({ _id: tripId }).lean() as {
    userId: string; editors?: string[]; status?: string
  } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.status === "archived") return NextResponse.json({ error: "Trip is archived" }, { status: 403 });

  const { name, url } = await req.json();
  if (!name?.trim() || !url?.trim()) return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
  if (!url.includes("google.com")) return NextResponse.json({ error: "URL must be a Google link" }, { status: 400 });

  const updated = await Trip.findByIdAndUpdate(
    tripId,
    { $push: { documents: { name: name.trim(), url: url.trim() } } },
    { new: true, select: "documents" }
  ).lean() as { documents: Array<{ _id: unknown; name: string; url: string }> } | null;

  const docs = (updated?.documents ?? []).map(d => ({ _id: String(d._id), name: d.name, url: d.url }));
  return NextResponse.json(docs, { status: 201 });
}

// DELETE /api/trips/[tripId]/documents?docId=xxx — remove a document link
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId } = await params;
  const docId = new URL(req.url).searchParams.get("docId");
  if (!docId) return NextResponse.json({ error: "docId required" }, { status: 400 });

  await connectDB();
  const trip = await Trip.findOne({ _id: tripId }).lean() as { userId: string; editors?: string[] } | null;
  if (!trip || !canAccess(trip, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Trip.findByIdAndUpdate(tripId, { $pull: { documents: { _id: docId } } });
  return NextResponse.json({ success: true });
}

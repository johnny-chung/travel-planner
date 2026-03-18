import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip, generateShareCode } from "@/lib/models/Plan";
import { User } from "@/lib/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const [ownedTrips, editorTrips, pendingTrips] = await Promise.all([
    Trip.find({ userId: session.user.id, status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).lean(),
    Trip.find({ editors: session.user.id, status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).lean(),
    Trip.find({ "pendingEditors.userId": session.user.id, status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).lean(),
  ]);
  const tripMap = new Map();
  for (const p of ownedTrips) tripMap.set(String(p._id), { ...p, role: "owner" });
  for (const p of editorTrips) if (!tripMap.has(String(p._id))) tripMap.set(String(p._id), { ...p, role: "editor" });
  for (const p of pendingTrips) if (!tripMap.has(String(p._id))) tripMap.set(String(p._id), { ...p, role: "pending" });
  const trips = [...tripMap.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, description, location, locationLat, locationLng } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  let centerLat: number | null = null;
  let centerLng: number | null = null;
  let centerName = "";
  if (typeof locationLat === "number" && typeof locationLng === "number") {
    centerLat = locationLat;
    centerLng = locationLng;
    centerName = location?.trim() ?? "";
  } else if (location?.trim()) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location.trim())}&key=${apiKey}`);
      const geoData = await geoRes.json();
      if (geoData.status === "OK" && geoData.results[0]) {
        const loc = geoData.results[0].geometry.location;
        centerLat = loc.lat;
        centerLng = loc.lng;
        centerName = geoData.results[0].formatted_address;
      }
    } catch { /* Geocoding failed */ }
  }
  try {
    await connectDB();
    const currentUserId = session.user.id;
    const user = await User.findOne({ userId: currentUserId });
    if (user?.membershipStatus === 'basic') {
      const activeOwned = await Trip.countDocuments({ userId: currentUserId, status: 'active' });
      if (activeOwned >= 1) {
        return NextResponse.json(
          { error: 'LIMIT_REACHED', message: 'Your Basic plan includes one active trip. To create a new one, you can upgrade to Pro for unlimited trips, or manage your existing trips by archiving or deleting one.' },
          { status: 403 }
        );
      }
    }
    let shareCode = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateShareCode();
      const existing = await Trip.findOne({ shareCode: candidate });
      if (!existing) { shareCode = candidate; break; }
    }
    if (!shareCode) return NextResponse.json({ error: "Could not generate unique share code" }, { status: 500 });
    const trip = await Trip.create({ userId: currentUserId, name: name.trim(), description: description?.trim() ?? "", centerLat, centerLng, centerName, shareCode });
    return NextResponse.json(trip, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create trip", detail: String(err) }, { status: 500 });
  }
}

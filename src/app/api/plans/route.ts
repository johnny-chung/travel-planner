import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Plan, generateShareCode } from "@/lib/models/Plan";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    console.error("[GET /api/plans] No session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const [ownedPlans, editorPlans, pendingPlans] = await Promise.all([
    Plan.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean(),
    Plan.find({ editors: session.user.id }).sort({ createdAt: -1 }).lean(),
    Plan.find({ 'pendingEditors.userId': session.user.id }).sort({ createdAt: -1 }).lean(),
  ]);

  const planMap = new Map();
  for (const p of ownedPlans) planMap.set(String(p._id), { ...p, role: 'owner' });
  for (const p of editorPlans) if (!planMap.has(String(p._id))) planMap.set(String(p._id), { ...p, role: 'editor' });
  for (const p of pendingPlans) if (!planMap.has(String(p._id))) planMap.set(String(p._id), { ...p, role: 'pending' });
  const plans = [...planMap.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    console.error("[POST /api/plans] No session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location.trim())}&key=${apiKey}`
      );
      const geoData = await geoRes.json();
      if (geoData.status === "OK" && geoData.results[0]) {
        const loc = geoData.results[0].geometry.location;
        centerLat = loc.lat;
        centerLng = loc.lng;
        centerName = geoData.results[0].formatted_address;
      }
    } catch {
      // Geocoding failed — center will default on the client
    }
  }

  try {
    await connectDB();

    let shareCode = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateShareCode();
      const existing = await Plan.findOne({ shareCode: candidate });
      if (!existing) { shareCode = candidate; break; }
    }
    if (!shareCode) return NextResponse.json({ error: "Could not generate unique share code" }, { status: 500 });

    const plan = await Plan.create({
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() ?? "",
      centerLat,
      centerLng,
      centerName,
      shareCode,
    });
    console.log("[POST /api/plans] Created plan:", plan._id, "for user:", session.user.id);
    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    console.error("[POST /api/plans] DB error:", err);
    return NextResponse.json({ error: "Failed to create plan", detail: String(err) }, { status: 500 });
  }
}
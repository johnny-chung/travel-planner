import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";
import { Stop } from "@/lib/models/Stop";
import PlanMapClient from "@/components/map/PlanMapClient";

type Props = { params: Promise<{ tripId: string }> };

export default async function PlanMapPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { tripId } = await params;
  await connectDB();

  const trip = await Trip.findOne({ _id: tripId }).lean() as {
    _id: unknown; userId: string; name: string; description?: string;
    centerLat?: number | null; centerLng?: number | null; centerName?: string;
    editors?: string[]; status?: string; transportMode?: string;
    documents?: Array<{ _id: unknown; name: string; url: string }>;
  } | null;
  
  if (!trip) notFound();
  const isOwner = trip.userId === session.user.id;
  const isEditor = (trip.editors ?? []).includes(session.user.id);
  if (!isOwner && !isEditor) notFound();

  const stops = await Stop.find({ planId: tripId }).sort({ "arrivals.0.date": 1, "arrivals.0.time": 1 }).lean();

  const serializedPlan = {
    _id: String(trip._id), name: trip.name, description: trip.description ?? "",
    centerLat: trip.centerLat ?? null, centerLng: trip.centerLng ?? null, centerName: trip.centerName ?? "",
    transportMode: (trip.transportMode ?? 'transit') as "transit" | "drive",
  };

  const serializedStops = stops.map((s, i) => {
    const arrivals = (s.arrivals as { date: string; time: string }[] | undefined) ?? [];
    const a0 = arrivals[0] ?? { date: "", time: "" };
    return {
      _id: String(s._id), planId: String(s.planId), name: s.name as string,
      address: (s.address ?? "") as string, lat: s.lat as number, lng: s.lng as number,
      placeId: (s.placeId ?? "") as string,
      date: a0.date, time: a0.time,
      arrivals,
      notes: (s.notes ?? "") as string, openingHours: (s.openingHours ?? []) as string[],
      phone: (s.phone ?? "") as string, website: (s.website ?? "") as string,
      thumbnail: (s.thumbnail ?? "") as string, order: i + 1,
      linkedDocIds: ((s.linkedDocIds ?? []) as string[]),
    };
  });

  const tripDocs = (trip.documents ?? []).map(d => ({ _id: String(d._id), name: d.name, url: d.url }));

  return (
    <PlanMapClient
      plan={serializedPlan}
      initialStops={serializedStops}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      isArchived={trip.status === "archived"}
      tripDocs={tripDocs}
      tripTransportMode={serializedPlan.transportMode}
    />
  );
}

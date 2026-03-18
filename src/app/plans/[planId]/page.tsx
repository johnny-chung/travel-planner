import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Plan } from "@/lib/models/Plan";
import { Stop } from "@/lib/models/Stop";
import PlanMapClient from "@/components/map/PlanMapClient";

type Props = { params: Promise<{ planId: string }> };

export default async function PlanPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { planId } = await params;
  await connectDB();

  const plan = await Plan.findOne({ _id: planId, userId: session.user.id }).lean() as {
    _id: unknown; name: string; description?: string; centerLat?: number | null;
    centerLng?: number | null; centerName?: string; transportMode?: string;
  } | null;
  if (!plan) notFound();

  const stops = await Stop.find({ planId, userId: session.user.id })
    .sort({ "arrivals.0.date": 1, "arrivals.0.time": 1 })
    .lean();

  const serializedPlan = {
    _id: String(plan._id),
    name: plan.name as string,
    description: (plan.description ?? "") as string,
    centerLat: (plan.centerLat ?? null) as number | null,
    centerLng: (plan.centerLng ?? null) as number | null,
    centerName: (plan.centerName ?? "") as string,
    transportMode: (plan.transportMode ?? 'transit') as "transit" | "drive",
  };

  const serializedStops = stops.map((s, i) => {
    const arrivals = (s.arrivals as { date: string; time: string }[] | undefined) ?? [];
    const a0 = arrivals[0] ?? { date: "", time: "" };
    return {
      _id: String(s._id),
      planId: String(s.planId),
      name: s.name as string,
      address: (s.address ?? "") as string,
      lat: s.lat as number,
      lng: s.lng as number,
      placeId: (s.placeId ?? "") as string,
      date: a0.date,
      time: a0.time,
      arrivals,
      notes: (s.notes ?? "") as string,
      openingHours: (s.openingHours ?? []) as string[],
      phone: (s.phone ?? "") as string,
      website: (s.website ?? "") as string,
      thumbnail: (s.thumbnail ?? "") as string,
      order: i + 1,
      linkedDocIds: ((s.linkedDocIds ?? []) as string[]),
    };
  });

  return (
    <PlanMapClient
      plan={serializedPlan}
      initialStops={serializedStops}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      tripTransportMode={serializedPlan.transportMode}
    />
  );
}

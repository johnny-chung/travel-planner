import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Plan } from "@/lib/models/Plan";
import PlansClient from "@/components/plans/PlansClient";

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const [ownedRaw, editorRaw, pendingRaw] = await Promise.all([
    Plan.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean(),
    Plan.find({ editors: session.user.id }).sort({ createdAt: -1 }).lean(),
    Plan.find({ "pendingEditors.userId": session.user.id }).sort({ createdAt: -1 }).lean(),
  ]);

  const planMap = new Map();
  for (const p of ownedRaw) planMap.set(String(p._id), { ...p, role: "owner" });
  for (const p of editorRaw) if (!planMap.has(String(p._id))) planMap.set(String(p._id), { ...p, role: "editor" });
  for (const p of pendingRaw) if (!planMap.has(String(p._id))) planMap.set(String(p._id), { ...p, role: "pending" });
  const plans = [...planMap.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const serialized = plans.map((p) => ({
    _id: String(p._id),
    name: p.name as string,
    description: (p.description ?? "") as string,
    centerName: (p.centerName ?? "") as string,
    centerLat: (p.centerLat ?? null) as number | null,
    centerLng: (p.centerLng ?? null) as number | null,
    createdAt: p.createdAt ? new Date(p.createdAt as Date).toISOString() : "",
    role: p.role as "owner" | "editor" | "pending",
    shareCode: (p.shareCode ?? "") as string,
  }));

  return (
    <PlansClient
      initialPlans={serialized}
      user={{ name: session.user.name ?? "", image: session.user.image ?? "" }}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    />
  );
}
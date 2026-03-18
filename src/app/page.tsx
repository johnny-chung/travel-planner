import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";
import { User } from "@/lib/models/User";
import HomeClient from "@/components/home/HomeClient";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await connectDB();

  const [ownedPlans, editorPlans, dbUser] = await Promise.all([
    Trip.find({ userId: session.user.id }).lean(),
    Trip.find({ editors: session.user.id }).lean(),
    User.findOne({ userId: session.user.id }).select("membershipStatus").lean(),
  ]);
  const planMap = new Map();
  for (const p of ownedPlans) planMap.set(String(p._id), p);
  for (const p of editorPlans) if (!planMap.has(String(p._id))) planMap.set(String(p._id), p);
  const plans = [...planMap.values()]
    .sort((a, b) => new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime())
    .slice(0, 3);

  const serialized = plans.map(p => ({
    _id: String(p._id), name: p.name as string, description: (p.description ?? "") as string,
    centerName: (p.centerName ?? "") as string, centerLat: (p.centerLat ?? null) as number | null,
    centerLng: (p.centerLng ?? null) as number | null,
    createdAt: p.createdAt ? new Date(p.createdAt as Date).toISOString() : "",
  }));

  const membershipStatus = (dbUser as { membershipStatus?: string } | null)?.membershipStatus ?? "basic";

  return (
    <HomeClient
      user={{ name: session.user.name ?? "", email: session.user.email ?? "", image: session.user.image ?? "" }}
      plans={serialized}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      membershipStatus={membershipStatus as "basic" | "pro"}
    />
  );
}
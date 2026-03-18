import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";
import { User } from "@/lib/models/User";
import ExpenseDetailClient from "@/components/expense/ExpenseDetailClient";

type Props = { params: Promise<{ tripId: string }> };

export default async function ExpenseDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { tripId } = await params;
  await connectDB();

  const trip = await Trip.findOne({ _id: tripId }).lean() as {
    _id: unknown; userId: string; name: string; editors?: string[];
  } | null;
  if (!trip) notFound();
  const isOwner = trip.userId === session.user.id;
  const isEditor = (trip.editors ?? []).includes(session.user.id);
  if (!isOwner && !isEditor) notFound();

  const memberIds = [trip.userId, ...(trip.editors ?? [])];
  const users = await User.find({ userId: { $in: memberIds } }).lean() as Array<{ userId: string; name: string; email: string; image: string }>;
  const members = memberIds.map(uid => {
    const u = users.find(u => u.userId === uid);
    return { userId: uid, name: u?.name ?? uid, email: u?.email ?? "", image: u?.image ?? "" };
  });

  return (
    <ExpenseDetailClient
      tripId={String(trip._id)}
      tripName={trip.name}
      currentUserId={session.user.id}
      members={members}
    />
  );
}

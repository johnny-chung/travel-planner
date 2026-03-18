import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Trip } from "@/lib/models/Plan";
import { Expense } from "@/lib/models/Expense";
import { User } from "@/lib/models/User";
import TripDetailClient from "@/components/trips/TripDetailClient";

type Props = { params: Promise<{ tripId: string }> };

export default async function TripDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { tripId } = await params;
  await connectDB();

  const trip = await Trip.findOne({ _id: tripId }).lean() as {
    _id: unknown; userId: string; name: string; description?: string;
    centerName?: string; editors?: string[]; shareCode?: string; status?: string;
    documents?: Array<{ _id: unknown; name: string; url: string }>;
  } | null;

  if (!trip) notFound();
  const isOwner = trip.userId === session.user.id;
  const isEditor = (trip.editors ?? []).includes(session.user.id);
  if (!isOwner && !isEditor) notFound();

  const memberIds = [trip.userId, ...(trip.editors ?? [])];
  const users = await User.find({ userId: { $in: memberIds } }).lean() as Array<{ userId: string; name: string; email: string; image: string }>;
  
  const members = memberIds.map(uid => {
    const u = users.find(u => u.userId === uid);
    return { userId: uid, name: u?.name ?? uid, email: u?.email ?? "", image: u?.image ?? "", isOwner: uid === trip.userId };
  });

  const expenses = await Expense.find({ tripId }).lean();
  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount as number), 0);

  return (
    <TripDetailClient
      trip={{
        _id: String(trip._id), name: trip.name, description: trip.description ?? "",
        centerName: trip.centerName ?? "", shareCode: trip.shareCode ?? "",
        role: isOwner ? "owner" : "editor",
        userId: trip.userId,
        status: trip.status ?? "active",
        documents: (trip.documents ?? []).map(d => ({ _id: String(d._id), name: d.name, url: d.url })),
      }}
      members={members}
      totalExpense={totalExpense}
      currentUserId={session.user.id}
    />
  );
}

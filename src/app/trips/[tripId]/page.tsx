import { notFound } from "next/navigation";
import { requireUserId } from "@/features/auth/session";
import { TripServiceError, getTripDetailForUser } from "@/features/trips/service";
import TripDetailClient from "@/components/trips/TripDetailClient";

type Props = { params: Promise<{ tripId: string }> };

export default async function TripDetailPage({ params }: Props) {
  const userId = await requireUserId();
  const { tripId } = await params;
  let detail;

  try {
    detail = await getTripDetailForUser(tripId, userId);
  } catch (error) {
    if (error instanceof TripServiceError) {
      notFound();
    }

    throw error;
  }

  return (
    <TripDetailClient
      trip={detail.trip}
      members={detail.members}
      totalExpense={detail.totalExpense}
      currentUserId={userId}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      backHref="/trips"
    />
  );
}

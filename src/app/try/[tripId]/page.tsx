import { auth } from "@/auth";
import TripDetailClient from "@/components/trips/TripDetailClient";
import { getGuestId } from "@/features/guest/session";
import { getTripDetailForGuest } from "@/features/trips/service";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ tripId: string }> };

export default async function TrialTripDetailPage({ params }: Props) {
  const session = await auth();
  if (session?.user?.id) {
    const { tripId } = await params;
    redirect(`/trips/${tripId}`);
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect("/try");
  }

  const { tripId } = await params;
  let detail;

  try {
    detail = await getTripDetailForGuest(tripId, guestId);
  } catch {
    notFound();
  }

  return (
    <TripDetailClient
      trip={detail.trip}
      members={detail.members}
      totalExpense={detail.totalExpense}
      currentUserId=""
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      backHref="/try"
      planHref={`/try/${tripId}/plan`}
    />
  );
}

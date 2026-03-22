import { auth } from "@/auth";
import TripDetailClient from "@/features/trips/components/TripDetailClient";
import { getGuestId } from "@/features/guest/session";
import { localizeHref, type AppLocale } from "@/features/i18n/config";
import { getTripDetailForGuest } from "@/features/trips/service";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ lang: AppLocale; tripId: string }> };

export default async function TrialTripDetailPage({ params }: Props) {
  const session = await auth();
  const { lang, tripId } = await params;
  if (session?.user?.id) {
    redirect(localizeHref(lang, `/trips/${tripId}`));
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect(localizeHref(lang, "/try"));
  }

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
      accessMode="guest"
      backHref={localizeHref(lang, "/try")}
      planHref={localizeHref(lang, `/try/${tripId}/plan`)}
      checklistHref={localizeHref(lang, `/try/${tripId}/checklist`)}
    />
  );
}

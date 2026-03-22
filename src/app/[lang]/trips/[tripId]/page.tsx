import { notFound } from "next/navigation";
import { requireUserId } from "@/features/auth/session";
import { localizeHref, type AppLocale } from "@/features/i18n/config";
import { TripServiceError, getTripDetailForUser } from "@/features/trips/service";
import TripDetailClient from "@/features/trips/components/TripDetailClient";

type Props = { params: Promise<{ lang: AppLocale; tripId: string }> };

export default async function TripDetailPage({ params }: Props) {
  const userId = await requireUserId();
  const { lang, tripId } = await params;
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
      backHref={localizeHref(lang, "/trips")}
      planHref={localizeHref(lang, `/trips/${tripId}/plan`)}
      expenseHref={localizeHref(lang, `/trips/${tripId}/expense`)}
      checklistHref={localizeHref(lang, `/trips/${tripId}/checklist`)}
    />
  );
}

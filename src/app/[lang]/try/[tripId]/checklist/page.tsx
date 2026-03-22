import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import ChecklistPageClient from "@/features/checklist/components/ChecklistPageClient";
import { getChecklistPageDataForGuest } from "@/features/checklist/service";
import { getGuestId } from "@/features/guest/session";
import { localizeHref, type AppLocale } from "@/features/i18n/config";
import { TripServiceError } from "@/features/trips/errors";

type Props = {
  params: Promise<{ lang: AppLocale; tripId: string }>;
};

export default async function TrialChecklistPage({ params }: Props) {
  const session = await auth();
  const { lang, tripId } = await params;

  if (session?.user?.id) {
    redirect(localizeHref(lang, `/trips/${tripId}/checklist`));
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect(localizeHref(lang, "/try"));
  }

  let pageData;
  try {
    pageData = await getChecklistPageDataForGuest(tripId, guestId);
  } catch (error) {
    if (error instanceof TripServiceError) {
      notFound();
    }

    throw error;
  }

  return (
    <ChecklistPageClient
      tripId={pageData.tripId}
      tripName={pageData.tripName}
      items={pageData.items}
      isArchived={pageData.isArchived}
      accessMode="guest"
      backHref={localizeHref(lang, `/try/${tripId}`)}
      returnTo={localizeHref(lang, `/try/${tripId}/checklist`)}
    />
  );
}

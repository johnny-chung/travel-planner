import { notFound } from "next/navigation";
import { requireUserId } from "@/features/auth/session";
import ChecklistPageClient from "@/features/checklist/components/ChecklistPageClient";
import { getChecklistPageDataForUser } from "@/features/checklist/service";
import { localizeHref, type AppLocale } from "@/features/i18n/config";
import { TripServiceError } from "@/features/trips/errors";

type Props = {
  params: Promise<{ lang: AppLocale; tripId: string }>;
};

export default async function TripChecklistPage({ params }: Props) {
  const userId = await requireUserId();
  const { lang, tripId } = await params;

  let pageData;
  try {
    pageData = await getChecklistPageDataForUser(tripId, userId);
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
      backHref={localizeHref(lang, `/trips/${tripId}`)}
      returnTo={localizeHref(lang, `/trips/${tripId}/checklist`)}
    />
  );
}

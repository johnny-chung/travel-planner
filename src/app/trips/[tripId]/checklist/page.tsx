import { notFound } from "next/navigation";
import { requireUserId } from "@/features/auth/session";
import ChecklistPageClient from "@/features/checklist/components/ChecklistPageClient";
import { getChecklistPageDataForUser } from "@/features/checklist/service";
import { TripServiceError } from "@/features/trips/errors";

type Props = {
  params: Promise<{ tripId: string }>;
};

export default async function TripChecklistPage({ params }: Props) {
  const userId = await requireUserId();
  const { tripId } = await params;

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
      backHref={`/trips/${tripId}`}
      returnTo={`/trips/${tripId}/checklist`}
    />
  );
}

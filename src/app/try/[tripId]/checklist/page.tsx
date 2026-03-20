import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import ChecklistPageClient from "@/features/checklist/components/ChecklistPageClient";
import { getChecklistPageDataForGuest } from "@/features/checklist/service";
import { getGuestId } from "@/features/guest/session";
import { TripServiceError } from "@/features/trips/errors";

type Props = {
  params: Promise<{ tripId: string }>;
};

export default async function TrialChecklistPage({ params }: Props) {
  const session = await auth();
  const { tripId } = await params;

  if (session?.user?.id) {
    redirect(`/trips/${tripId}/checklist`);
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect("/try");
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
      backHref={`/try/${tripId}`}
      returnTo={`/try/${tripId}/checklist`}
    />
  );
}

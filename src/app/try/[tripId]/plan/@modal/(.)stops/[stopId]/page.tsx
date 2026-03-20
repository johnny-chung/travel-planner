import { Suspense } from "react";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/features/guest/session";
import PlannerDetailDrawer from "@/features/planner/components/detail/PlannerDetailDrawer";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStopDetailView from "@/features/planner/components/detail/PlannerStopDetailView";
import { getPlannerStopDetailForGuest } from "@/features/planner/service";
import { parsePlannerSearchParams } from "@/features/planner/search-params";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ tripId: string; stopId: string }>;
  searchParams: Promise<SearchParams>;
};

async function TrialStopModalContent({ params, searchParams }: Props) {
  const session = await auth();
  const [{ tripId, stopId }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  if (session?.user?.id) {
    redirect(`/trips/${tripId}/plan/stops/${stopId}`);
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect("/try");
  }

  const searchState = parsePlannerSearchParams(rawSearchParams);
  const detail = await getPlannerStopDetailForGuest(
    tripId,
    stopId,
    guestId,
    searchState.from,
    searchState.to,
  );

  if (!detail) {
    notFound();
  }

  return (
    <PlannerStopDetailView
      pathname={`/try/${tripId}/plan`}
      tripId={tripId}
      searchState={searchState}
      stop={detail.stop}
      isEdit={false}
      relatedStops={detail.relatedStops}
      previousStop={detail.previousStop}
      nextStop={detail.nextStop}
      tripDocs={detail.tripDocs}
      accessMode="guest"
      capabilities={detail.capabilities}
    />
  );
}

export default function TrialStopModalPage(props: Props) {
  return (
    <PlannerDetailDrawer title="Stop detail">
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TrialStopModalContent {...props} />
      </Suspense>
    </PlannerDetailDrawer>
  );
}

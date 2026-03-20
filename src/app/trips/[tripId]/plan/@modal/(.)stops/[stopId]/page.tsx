import { Suspense } from "react";

import PlannerDetailDrawer from "@/features/planner/components/detail/PlannerDetailDrawer";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStopDetailView from "@/features/planner/components/detail/PlannerStopDetailView";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import {
  getPlannerStopDetailForUser,
} from "@/features/planner/service";
import { parsePlannerSearchParams } from "@/features/planner/search-params";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ tripId: string; stopId: string }>;
  searchParams: Promise<SearchParams>;
};

async function TripStopModalContent({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [{ tripId, stopId }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const searchState = parsePlannerSearchParams(rawSearchParams);
  const detail = await getPlannerStopDetailForUser(
    tripId,
    stopId,
    session.user.id,
    searchState.from,
    searchState.to,
  );

  if (!detail) {
    notFound();
  }

  return (
    <PlannerStopDetailView
      pathname={`/trips/${tripId}/plan`}
      tripId={tripId}
      searchState={searchState}
      stop={detail.stop}
      isEdit={false}
      relatedStops={detail.relatedStops}
      previousStop={detail.previousStop}
      nextStop={detail.nextStop}
      tripDocs={detail.tripDocs}
      accessMode="user"
      capabilities={detail.capabilities}
    />
  );
}

export default function TripStopModalPage(props: Props) {
  return (
    <PlannerDetailDrawer title="Stop detail">
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TripStopModalContent {...props} />
      </Suspense>
    </PlannerDetailDrawer>
  );
}

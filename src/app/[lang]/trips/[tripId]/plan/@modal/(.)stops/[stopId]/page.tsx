import { Suspense } from "react";

import PlannerDetailDrawer from "@/features/planner/components/detail/PlannerDetailDrawer";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStopDetailView from "@/features/planner/components/detail/PlannerStopDetailView";
import { buildPlannerBaseHref } from "@/features/planner/route-hrefs";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import {
  getPlannerStopDetailForUser,
} from "@/features/planner/service";
import { parsePlannerSearchParams } from "@/features/planner/search-params";
import { getDictionary } from "@/features/i18n/dictionaries";
import type { AppLocale } from "@/features/i18n/config";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ lang: AppLocale; tripId: string; stopId: string }>;
  searchParams: Promise<SearchParams>;
};

async function TripStopModalContent({ params, searchParams }: Props) {
  const session = await auth();
  const { lang } = await params;
  if (!session?.user?.id) redirect(`/${lang}/login`);

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
      pathname={`/${lang}/trips/${tripId}/plan`}
      tripId={tripId}
      searchState={searchState}
      stop={detail.stop}
      isEdit={false}
      relatedStops={detail.relatedStops}
      previousStop={detail.previousStop}
      nextStop={detail.nextStop}
      tripDocs={detail.tripDocs}
      travelDates={detail.travelDates}
      accessMode="user"
      capabilities={detail.capabilities}
    />
  );
}

export default async function TripStopModalPage(props: Props) {
  const [{ lang, tripId }, rawSearchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const dictionary = getDictionary(lang);
  const closeHref = buildPlannerBaseHref(
    `/${lang}/trips/${tripId}/plan`,
    parsePlannerSearchParams(rawSearchParams),
  );

  return (
    <PlannerDetailDrawer
      title={dictionary.planner.stopDetailTitle}
      closeHref={closeHref}
    >
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TripStopModalContent {...props} />
      </Suspense>
    </PlannerDetailDrawer>
  );
}

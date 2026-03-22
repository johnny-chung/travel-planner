import { Suspense } from "react";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/features/guest/session";
import PlannerDetailDrawer from "@/features/planner/components/detail/PlannerDetailDrawer";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStopDetailView from "@/features/planner/components/detail/PlannerStopDetailView";
import { buildPlannerBaseHref } from "@/features/planner/route-hrefs";
import { getPlannerStopDetailForGuest } from "@/features/planner/service";
import { parsePlannerSearchParams } from "@/features/planner/search-params";
import { getDictionary } from "@/features/i18n/dictionaries";
import type { AppLocale } from "@/features/i18n/config";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ lang: AppLocale; tripId: string; stopId: string }>;
  searchParams: Promise<SearchParams>;
};

async function TrialStopEditModalContent({ params, searchParams }: Props) {
  const session = await auth();
  const [{ tripId, stopId }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const { lang } = await params;

  if (session?.user?.id) {
    redirect(`/${lang}/trips/${tripId}/plan/stops/${stopId}/edit`);
  }

  const guestId = await getGuestId();
  if (!guestId) redirect(`/${lang}/try`);

  const searchState = parsePlannerSearchParams(rawSearchParams);
  const detail = await getPlannerStopDetailForGuest(
    tripId,
    stopId,
    guestId,
    searchState.from,
    searchState.to,
  );

  if (!detail) notFound();

  return (
    <PlannerStopDetailView
      pathname={`/${lang}/try/${tripId}/plan`}
      tripId={tripId}
      searchState={searchState}
      stop={detail.stop}
      isEdit
      relatedStops={detail.relatedStops}
      previousStop={detail.previousStop}
      nextStop={detail.nextStop}
      tripDocs={detail.tripDocs}
      travelDates={detail.travelDates}
      accessMode="guest"
      capabilities={detail.capabilities}
    />
  );
}

export default async function TrialStopEditModalPage(props: Props) {
  const [{ lang, tripId }, rawSearchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const dictionary = getDictionary(lang);
  const closeHref = buildPlannerBaseHref(
    `/${lang}/try/${tripId}/plan`,
    parsePlannerSearchParams(rawSearchParams),
  );

  return (
    <PlannerDetailDrawer
      title={dictionary.planner.editStopTitle}
      closeHref={closeHref}
    >
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TrialStopEditModalContent {...props} />
      </Suspense>
    </PlannerDetailDrawer>
  );
}

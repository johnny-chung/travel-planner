import { Suspense } from "react";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import PlannerDetailPageShell from "@/features/planner/components/detail/PlannerDetailPageShell";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStopDetailView from "@/features/planner/components/detail/PlannerStopDetailView";
import { getGuestId } from "@/features/guest/session";
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

async function TrialStopDetailContent({ params, searchParams }: Props) {
  const session = await auth();
  const [{ tripId, stopId }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const { lang } = await params;

  if (session?.user?.id) {
    redirect(`/${lang}/trips/${tripId}/plan/stops/${stopId}`);
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect(`/${lang}/try`);
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
      pathname={`/${lang}/try/${tripId}/plan`}
      tripId={tripId}
      searchState={searchState}
      stop={detail.stop}
      isEdit={false}
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

async function TrialStopDetailPageFrame({ params, searchParams }: Props) {
  const [{ lang, tripId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const dictionary = getDictionary(lang);
  const searchState = parsePlannerSearchParams(rawSearchParams);
  const pathname = `/${lang}/try/${tripId}/plan`;

  return (
    <PlannerDetailPageShell
      backHref={buildPlannerBaseHref(pathname, searchState)}
      backLabel={dictionary.planner.backToPlanner}
    >
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TrialStopDetailContent params={params} searchParams={searchParams} />
      </Suspense>
    </PlannerDetailPageShell>
  );
}

export default function TrialStopDetailPage(props: Props) {
  return <TrialStopDetailPageFrame {...props} />;
}

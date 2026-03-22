import { Suspense } from "react";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/features/guest/session";
import PlannerDetailPageShell from "@/features/planner/components/detail/PlannerDetailPageShell";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStayDetailView from "@/features/planner/components/detail/PlannerStayDetailView";
import { buildPlannerBaseHref } from "@/features/planner/route-hrefs";
import { getPlannerStayDetailForGuest } from "@/features/planner/service";
import { parsePlannerSearchParams } from "@/features/planner/search-params";
import { getDictionary } from "@/features/i18n/dictionaries";
import type { AppLocale } from "@/features/i18n/config";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ lang: AppLocale; tripId: string; stayId: string }>;
  searchParams: Promise<SearchParams>;
};

async function TrialStayDetailContent({ params }: Props) {
  const session = await auth();
  const { tripId, stayId } = await params;
  const { lang } = await params;

  if (session?.user?.id) {
    redirect(`/${lang}/trips/${tripId}/plan/stays/${stayId}`);
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect(`/${lang}/try`);
  }

  const detail = await getPlannerStayDetailForGuest(tripId, stayId, guestId);
  if (!detail) {
    notFound();
  }

  return <PlannerStayDetailView stay={detail.stay} />;
}

async function TrialStayDetailPageFrame({ params, searchParams }: Props) {
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
        <TrialStayDetailContent params={params} searchParams={searchParams} />
      </Suspense>
    </PlannerDetailPageShell>
  );
}

export default function TrialStayDetailPage(props: Props) {
  return <TrialStayDetailPageFrame {...props} />;
}

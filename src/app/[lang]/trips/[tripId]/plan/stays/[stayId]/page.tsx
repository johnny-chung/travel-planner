import { Suspense } from "react";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import PlannerDetailPageShell from "@/features/planner/components/detail/PlannerDetailPageShell";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStayDetailView from "@/features/planner/components/detail/PlannerStayDetailView";
import { buildPlannerBaseHref } from "@/features/planner/route-hrefs";
import { getPlannerStayDetailForUser } from "@/features/planner/service";
import { parsePlannerSearchParams } from "@/features/planner/search-params";
import { getDictionary } from "@/features/i18n/dictionaries";
import type { AppLocale } from "@/features/i18n/config";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ lang: AppLocale; tripId: string; stayId: string }>;
  searchParams: Promise<SearchParams>;
};

async function TripStayDetailContent({ params }: Props) {
  const session = await auth();
  const { lang } = await params;
  if (!session?.user?.id) redirect(`/${lang}/login`);

  const { tripId, stayId } = await params;
  const detail = await getPlannerStayDetailForUser(tripId, stayId, session.user.id);

  if (!detail) {
    notFound();
  }

  return <PlannerStayDetailView stay={detail.stay} />;
}

async function TripStayDetailPageFrame({ params, searchParams }: Props) {
  const [{ lang, tripId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const dictionary = getDictionary(lang);
  const searchState = parsePlannerSearchParams(rawSearchParams);
  const pathname = `/${lang}/trips/${tripId}/plan`;

  return (
    <PlannerDetailPageShell
      backHref={buildPlannerBaseHref(pathname, searchState)}
      backLabel={dictionary.planner.backToPlanner}
    >
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TripStayDetailContent params={params} searchParams={searchParams} />
      </Suspense>
    </PlannerDetailPageShell>
  );
}

export default function TripStayDetailPage(props: Props) {
  return <TripStayDetailPageFrame {...props} />;
}

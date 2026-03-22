import { Suspense } from "react";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import PlannerDetailDrawer from "@/features/planner/components/detail/PlannerDetailDrawer";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStayDetailView from "@/features/planner/components/detail/PlannerStayDetailView";
import { buildPlannerBaseHref } from "@/features/planner/route-hrefs";
import { parsePlannerSearchParams } from "@/features/planner/search-params";
import { getPlannerStayDetailForUser } from "@/features/planner/service";
import { getDictionary } from "@/features/i18n/dictionaries";
import type { AppLocale } from "@/features/i18n/config";

type Props = {
  params: Promise<{ lang: AppLocale; tripId: string; stayId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function TripStayModalContent({ params }: Props) {
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

export default async function TripStayModalPage(props: Props) {
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
      title={dictionary.planner.stayDetailTitle}
      closeHref={closeHref}
    >
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TripStayModalContent {...props} />
      </Suspense>
    </PlannerDetailDrawer>
  );
}

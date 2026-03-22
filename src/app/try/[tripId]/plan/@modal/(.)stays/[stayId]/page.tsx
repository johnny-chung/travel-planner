import { Suspense } from "react";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/features/guest/session";
import PlannerDetailDrawer from "@/features/planner/components/detail/PlannerDetailDrawer";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStayDetailView from "@/features/planner/components/detail/PlannerStayDetailView";
import { buildPlannerBaseHref } from "@/features/planner/route-hrefs";
import { parsePlannerSearchParams } from "@/features/planner/search-params";
import { getPlannerStayDetailForGuest } from "@/features/planner/service";

type Props = {
  params: Promise<{ tripId: string; stayId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function TrialStayModalContent({ params }: Props) {
  const session = await auth();
  const { tripId, stayId } = await params;

  if (session?.user?.id) {
    redirect(`/trips/${tripId}/plan/stays/${stayId}`);
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect("/try");
  }

  const detail = await getPlannerStayDetailForGuest(tripId, stayId, guestId);
  if (!detail) {
    notFound();
  }

  return <PlannerStayDetailView stay={detail.stay} />;
}

export default async function TrialStayModalPage(props: Props) {
  const [{ tripId }, rawSearchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const closeHref = buildPlannerBaseHref(
    `/try/${tripId}/plan`,
    parsePlannerSearchParams(rawSearchParams),
  );

  return (
    <PlannerDetailDrawer title="Stay detail" closeHref={closeHref}>
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TrialStayModalContent {...props} />
      </Suspense>
    </PlannerDetailDrawer>
  );
}

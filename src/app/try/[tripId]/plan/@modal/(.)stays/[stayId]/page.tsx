import { Suspense } from "react";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/features/guest/session";
import PlannerDetailDrawer from "@/features/planner/components/detail/PlannerDetailDrawer";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStayDetailView from "@/features/planner/components/detail/PlannerStayDetailView";
import { getPlannerStayDetailForGuest } from "@/features/planner/service";

type Props = {
  params: Promise<{ tripId: string; stayId: string }>;
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

export default function TrialStayModalPage(props: Props) {
  return (
    <PlannerDetailDrawer title="Stay detail">
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TrialStayModalContent {...props} />
      </Suspense>
    </PlannerDetailDrawer>
  );
}

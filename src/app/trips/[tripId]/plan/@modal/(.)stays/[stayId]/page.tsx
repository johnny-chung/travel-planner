import { Suspense } from "react";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import PlannerDetailDrawer from "@/features/planner/components/detail/PlannerDetailDrawer";
import PlannerDetailSkeleton from "@/features/planner/components/detail/PlannerDetailSkeleton";
import PlannerStayDetailView from "@/features/planner/components/detail/PlannerStayDetailView";
import { getPlannerStayDetailForUser } from "@/features/planner/service";

type Props = {
  params: Promise<{ tripId: string; stayId: string }>;
};

async function TripStayModalContent({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { tripId, stayId } = await params;
  const detail = await getPlannerStayDetailForUser(tripId, stayId, session.user.id);

  if (!detail) {
    notFound();
  }

  return <PlannerStayDetailView stay={detail.stay} />;
}

export default function TripStayModalPage(props: Props) {
  return (
    <PlannerDetailDrawer title="Stay detail">
      <Suspense fallback={<PlannerDetailSkeleton />}>
        <TripStayModalContent {...props} />
      </Suspense>
    </PlannerDetailDrawer>
  );
}

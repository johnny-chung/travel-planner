import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";

import { getGuestId } from "@/features/guest/session";
import PlannerPrintPrompt from "@/features/planner/components/print/PlannerPrintPrompt";
import PlannerPrintView from "@/features/planner/components/print/PlannerPrintView";
import { getTripPlannerDataForGuest } from "@/features/planner/service";
import { parsePlannerSearchParams } from "@/features/planner/search-params";
import type { PlannerTimelineItem } from "@/features/planner/components/plan-map/types";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<SearchParams>;
};

function isPdfRender(source: SearchParams) {
  const value = source.pdf;
  return value === "1" || (Array.isArray(value) && value[0] === "1");
}

export default async function TrialPlanPrintPage({ params, searchParams }: Props) {
  const session = await auth();
  const [{ tripId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const pdfRender = isPdfRender(rawSearchParams);

  if (session?.user?.id) {
    redirect(`/trips/${tripId}/plan/print`);
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect("/try");
  }

  const searchState = parsePlannerSearchParams(rawSearchParams);
  const plannerData = await getTripPlannerDataForGuest(
    tripId,
    guestId,
    searchState.from,
    searchState.to,
  );

  if (!plannerData) notFound();

  const unscheduledItems: PlannerTimelineItem[] = plannerData.unscheduledStops.map((stop) => ({
    kind: "stop",
    id: stop._id,
    date: "",
    time: "",
    stop,
  }));

  return (
    <div className="min-h-screen bg-background">
      {!pdfRender ? <PlannerPrintPrompt /> : null}
      <PlannerPrintView
        planName={plannerData.plan.name}
        description={plannerData.plan.description}
        timelineItems={plannerData.timelineItems}
        unscheduledStops={unscheduledItems}
        travelTimes={plannerData.travelTimes}
        from={searchState.from}
        to={searchState.to}
      />
    </div>
  );
}

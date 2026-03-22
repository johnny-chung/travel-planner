import StopDetailModal from "@/features/planner/components/stops/StopDetailModal";
import { buildPlannerBaseHref, buildPlannerStopModalHref } from "@/features/planner/route-hrefs";
import type { PlannerSearchState } from "@/features/planner/search-params";
import type { Stop, TripDoc } from "@/features/planner/components/plan-map/types";
import type { TripCapabilities } from "@/types/travel";

type Props = {
  pathname: string;
  tripId: string;
  searchState: PlannerSearchState;
  stop: Stop;
  isEdit: boolean;
  relatedStops: Stop[];
  previousStop?: Stop | null;
  nextStop?: Stop | null;
  tripDocs: TripDoc[];
  travelDates?: string[];
  accessMode: "user" | "guest";
  capabilities: TripCapabilities;
};

export default function PlannerStopDetailView({
  pathname,
  tripId,
  searchState,
  stop,
  isEdit,
  relatedStops,
  previousStop,
  nextStop,
  tripDocs,
  travelDates = [],
  accessMode,
  capabilities,
}: Props) {
  const closeHref = buildPlannerBaseHref(pathname, searchState);
  const viewHref = buildPlannerStopModalHref(pathname, searchState, stop._id);
  const editHref = buildPlannerStopModalHref(pathname, searchState, stop._id, {
    edit: true,
  });

  return (
    <StopDetailModal
      key={`${stop._id}-${isEdit ? "edit" : "view"}`}
      tripId={tripId}
      stop={stop}
      relatedStops={relatedStops}
      isEdit={isEdit && stop.editable !== false}
      tripDocs={tripDocs}
      viewHref={viewHref}
      editHref={editHref}
      prevHref={
        previousStop
          ? buildPlannerStopModalHref(pathname, searchState, previousStop._id)
          : null
      }
      nextHref={
        nextStop
          ? buildPlannerStopModalHref(pathname, searchState, nextStop._id)
          : null
      }
      tripDates={travelDates}
      deleteReturnTo={closeHref}
      accessMode={accessMode}
      canVisitAgain={capabilities.canVisitAgain}
    />
  );
}

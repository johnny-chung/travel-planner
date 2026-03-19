import { buildPlannerHref, type PlannerSearchState } from "@/features/planner/search-params";
import CalculateTravelTimesDialog from "@/components/map/plan-map/CalculateTravelTimesDialog";
import PlannerAddStopDialog from "@/components/map/plan-map/PlannerAddStopDialog";
import SharePlanButton from "@/components/map/plan-map/SharePlanButton";
import type { TripDoc } from "@/components/map/plan-map/types";

type Props = {
  pathname: string;
  tripId: string;
  planName: string;
  shareText: string;
  searchState: PlannerSearchState;
  isArchived: boolean;
  canCalculate: boolean;
  tripDocs: TripDoc[];
  googleMapsApiKey: string;
};

export default function PlannerListActions({
  pathname,
  tripId,
  planName,
  shareText,
  searchState,
  isArchived,
  canCalculate,
  tripDocs,
  googleMapsApiKey,
}: Props) {
  const returnTo = buildPlannerHref(pathname, searchState, {
    stopId: null,
    arrivalIndex: 0,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });

  return (
    <>
      <div className="hidden md:flex fixed bottom-6 right-6 z-30 items-center gap-3">
        <SharePlanButton
          title={`${planName} itinerary`}
          text={shareText}
          disabled={!shareText}
          triggerClassName="rounded-full border bg-card px-4 shadow-lg"
        />
        <CalculateTravelTimesDialog
          tripId={tripId}
          returnTo={returnTo}
          disabled={!canCalculate || isArchived}
          triggerClassName="rounded-full border bg-card px-4 shadow-lg"
        />
        <PlannerAddStopDialog
          tripId={tripId}
          tripDocs={tripDocs}
          returnTo={returnTo}
          apiKey={googleMapsApiKey}
          disabled={isArchived || !googleMapsApiKey}
          iconOnly={false}
          triggerClassName="rounded-full bg-primary px-4 text-primary-foreground shadow-lg hover:bg-primary/90"
        />
      </div>

      <div className="md:hidden fixed bottom-20 right-4 z-30 flex items-center gap-2">
        <SharePlanButton
          title={`${planName} itinerary`}
          text={shareText}
          disabled={!shareText}
          iconOnly
          triggerClassName="size-12 rounded-full border bg-card shadow-lg"
        />
        <CalculateTravelTimesDialog
          tripId={tripId}
          returnTo={returnTo}
          disabled={!canCalculate || isArchived}
          iconOnly
          triggerClassName="size-12 rounded-full border bg-card shadow-lg"
        />
        <PlannerAddStopDialog
          tripId={tripId}
          tripDocs={tripDocs}
          returnTo={returnTo}
          apiKey={googleMapsApiKey}
          disabled={isArchived || !googleMapsApiKey}
          triggerClassName="size-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        />
      </div>
    </>
  );
}

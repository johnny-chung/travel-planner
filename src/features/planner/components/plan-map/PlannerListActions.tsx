import { buildPlannerHref, type PlannerSearchState } from "@/features/planner/search-params";
import CalculateTravelTimesDialog from "@/features/planner/components/plan-map/CalculateTravelTimesDialog";
import PlannerAddStopDialog from "@/features/planner/components/plan-map/PlannerAddStopDialog";
import PlannerMyMapsExportButton from "@/features/planner/components/plan-map/PlannerMyMapsExportButton";
import SharePlanButton from "@/features/planner/components/plan-map/SharePlanButton";
import PlannerPrintButton from "@/features/planner/components/print/PlannerPrintButton";
import type { TripDoc } from "@/features/planner/components/plan-map/types";
import type { TripCapabilities } from "@/types/travel";
import {
  buildPlannerMyMapsExportHref,
  buildPlannerPdfHref,
} from "@/features/planner/route-hrefs";

type Props = {
  pathname: string;
  tripId: string;
  planName: string;
  tripDates?: string[];
  shareText: string;
  searchState: PlannerSearchState;
  isArchived: boolean;
  capabilities: TripCapabilities;
  canCalculate: boolean;
  tripDocs: TripDoc[];
  googleMapsApiKey: string;
  accessMode?: "user" | "guest";
};

export default function PlannerListActions({
  pathname,
  tripId,
  planName,
  tripDates = [],
  shareText,
  searchState,
  isArchived,
  capabilities,
  canCalculate,
  tripDocs,
  googleMapsApiKey,
  accessMode = "user",
}: Props) {
  const returnTo = buildPlannerHref(pathname, searchState, {
    stopId: null,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });
  const printHref = buildPlannerPdfHref(pathname, searchState);
  const myMapsExportHref = buildPlannerMyMapsExportHref(pathname);

  return (
    <>
      <div className="hidden md:flex fixed bottom-6 right-6 z-30 items-center gap-3">
        <PlannerMyMapsExportButton
          href={myMapsExportHref}
          restricted={accessMode === "guest"}
          triggerClassName="h-10 rounded-full border bg-card px-5 shadow-lg whitespace-nowrap"
        />
        <PlannerPrintButton
          href={printHref}
          className="inline-flex h-10 min-w-36 items-center rounded-full border bg-card px-5 shadow-lg whitespace-nowrap"
        />
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
          restricted={!capabilities.canCalculateRoutes}
          triggerClassName="rounded-full border bg-card px-4 shadow-lg"
        />
        <PlannerAddStopDialog
          tripId={tripId}
          tripDates={tripDates}
          tripDocs={tripDocs}
          returnTo={returnTo}
          apiKey={googleMapsApiKey}
          accessMode={accessMode}
          disabled={isArchived || !googleMapsApiKey}
          iconOnly={false}
          triggerClassName="rounded-full bg-primary px-4 text-primary-foreground shadow-lg hover:bg-primary/90"
        />
      </div>

      <div className="md:hidden fixed bottom-20 right-4 z-30 flex items-center gap-2">
        <PlannerMyMapsExportButton
          href={myMapsExportHref}
          restricted={accessMode === "guest"}
          iconOnly
          triggerClassName="size-12 rounded-full border bg-card shadow-lg"
        />
        <PlannerPrintButton
          href={printHref}
          iconOnly
          className="inline-flex size-12 items-center justify-center rounded-full border bg-card shadow-lg"
        />
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
          restricted={!capabilities.canCalculateRoutes}
          iconOnly
          triggerClassName="size-12 rounded-full border bg-card shadow-lg"
        />
        <PlannerAddStopDialog
          tripId={tripId}
          tripDates={tripDates}
          tripDocs={tripDocs}
          returnTo={returnTo}
          apiKey={googleMapsApiKey}
          accessMode={accessMode}
          disabled={isArchived || !googleMapsApiKey}
          triggerClassName="size-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        />
      </div>
    </>
  );
}

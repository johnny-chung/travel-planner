import Link from "next/link";
import { X } from "lucide-react";
import { getRequestDictionary } from "@/features/i18n/server";
import {
  buildPlannerHref,
  type PlannerSearchState,
} from "@/features/planner/search-params";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/ui/date-range-picker";
import PlannerFilterSwitch from "@/features/planner/components/plan-map/PlannerFilterSwitch";

type Props = {
  pathname: string;
  searchState: PlannerSearchState;
  tripDates: string[];
};

export default async function PlannerFiltersForm({
  pathname,
  searchState,
  tripDates,
}: Props) {
  const { dictionary } = await getRequestDictionary();
  const clearHref = buildPlannerHref(pathname, searchState, {
    from: null,
    to: null,
    hideUnscheduledMap: null,
    hideStaysMap: null,
    stopId: null,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm flex-shrink-0">
      <form method="get" className="max-w-3xl mx-auto space-y-3">
        <input type="hidden" name="view" value={searchState.view} />
        <input type="hidden" name="filters" value="1" />
        <DateRangePicker
          fromName="from"
          toName="to"
          fromValue={searchState.from}
          toValue={searchState.to}
          highlightDates={tripDates}
          highlightLabel={dictionary.planner.tripDaysHighlighted}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <PlannerFilterSwitch
            id="planner-hide-unscheduled"
            name="hideUnscheduled"
            label={dictionary.planner.unscheduledStops}
            defaultChecked={searchState.hideUnscheduledMap}
          />
          <PlannerFilterSwitch
            id="planner-hide-stays"
            name="hideStays"
            label={dictionary.planner.stays}
            defaultChecked={searchState.hideStaysMap}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="outline" className="rounded-xl h-9">
            {dictionary.planner.applyFilters}
          </Button>
          {searchState.from ||
          searchState.to ||
          searchState.hideUnscheduledMap ||
          searchState.hideStaysMap ? (
            <Link
              href={clearHref}
              className="h-9 w-9 rounded-xl inline-flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}

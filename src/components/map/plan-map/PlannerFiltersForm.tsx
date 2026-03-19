import Link from "next/link";
import { X } from "lucide-react";
import { buildPlannerHref, type PlannerSearchState } from "@/features/planner/search-params";
import { Button } from "@/components/ui/button";
import PlannerDateField from "@/components/map/plan-map/PlannerDateField";

type Props = {
  pathname: string;
  searchState: PlannerSearchState;
  tripDates: string[];
};

export default function PlannerFiltersForm({
  pathname,
  searchState,
  tripDates,
}: Props) {
  const clearHref = buildPlannerHref(pathname, searchState, {
    from: null,
    to: null,
    stopId: null,
    arrivalIndex: 0,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm flex-shrink-0">
      <form method="get" className="max-w-3xl mx-auto flex items-end gap-3">
        <input type="hidden" name="view" value={searchState.view} />
        <input type="hidden" name="filters" value="1" />
        <PlannerDateField
          id="planner-filter-from"
          name="from"
          label="From"
          value={searchState.from}
          tripDates={tripDates}
        />
        <PlannerDateField
          id="planner-filter-to"
          name="to"
          label="To"
          value={searchState.to}
          tripDates={tripDates}
        />
        <Button type="submit" variant="outline" className="rounded-xl h-9">
          Apply
        </Button>
        {(searchState.from || searchState.to) ? (
          <Link
            href={clearHref}
            className="h-9 w-9 rounded-xl inline-flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </Link>
        ) : null}
      </form>
    </div>
  );
}

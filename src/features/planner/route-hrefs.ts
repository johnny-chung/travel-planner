import {
  buildPlannerHref,
  type PlannerSearchState,
  type PlannerView,
} from "@/features/planner/search-params";

type PlannerBaseOverrides = Partial<{
  view: PlannerView | null;
  sidebarTab: "itinerary" | "suggestions" | null;
  from: string | null;
  to: string | null;
  filters: boolean | null;
  hideUnscheduledMap: boolean | null;
  hideStaysMap: boolean | null;
  suggestLookup: boolean | null;
  focusLat: string | null;
  focusLng: string | null;
  suggestLat: string | null;
  suggestLng: string | null;
  suggestionMarkerLat: string | null;
  suggestionMarkerLng: string | null;
  suggestCategory: "tourism" | "catering" | null;
  travelFrom: string | null;
  travelTo: string | null;
}>;

function buildPlannerBaseStateOverrides(overrides: PlannerBaseOverrides = {}) {
  return {
    stopId: null,
    stayId: null,
    edit: null,
    travelFrom:
      overrides.travelFrom === undefined ? null : overrides.travelFrom,
    travelTo: overrides.travelTo === undefined ? null : overrides.travelTo,
    view: overrides.view,
    sidebarTab: overrides.sidebarTab,
    from: overrides.from,
    to: overrides.to,
    filters: overrides.filters,
    hideUnscheduledMap: overrides.hideUnscheduledMap,
    hideStaysMap: overrides.hideStaysMap,
    suggestLookup: overrides.suggestLookup,
    focusLat: overrides.focusLat,
    focusLng: overrides.focusLng,
    suggestLat: overrides.suggestLat,
    suggestLng: overrides.suggestLng,
    suggestionMarkerLat: overrides.suggestionMarkerLat,
    suggestionMarkerLng: overrides.suggestionMarkerLng,
    suggestCategory: overrides.suggestCategory,
  };
}

export function buildPlannerBaseHref(
  pathname: string,
  searchState: PlannerSearchState,
  overrides: PlannerBaseOverrides = {},
) {
  return buildPlannerHref(
    pathname,
    searchState,
    buildPlannerBaseStateOverrides(overrides),
  );
}

export function buildPlannerStopModalHref(
  pathname: string,
  searchState: PlannerSearchState,
  stopId: string,
  options?: { edit?: boolean },
) {
  const baseHref = buildPlannerBaseHref(pathname, searchState);
  const url = new URL(baseHref, "https://planner.local");
  const search = url.searchParams.toString();
  const suffix = options?.edit ? "/edit" : "";
  return `${pathname}/stops/${stopId}${suffix}${search ? `?${search}` : ""}`;
}

export function buildPlannerStayModalHref(
  pathname: string,
  searchState: PlannerSearchState,
  stayId: string,
) {
  const baseHref = buildPlannerBaseHref(pathname, searchState);
  const url = new URL(baseHref, "https://planner.local");
  const search = url.searchParams.toString();
  return `${pathname}/stays/${stayId}${search ? `?${search}` : ""}`;
}

export function buildPlannerPrintHref(
  pathname: string,
  searchState: PlannerSearchState,
) {
  const baseHref = buildPlannerBaseHref(pathname, searchState, {
    view: "list",
    sidebarTab: "itinerary",
    travelFrom: null,
    travelTo: null,
    focusLat: null,
    focusLng: null,
    suggestLookup: null,
    suggestLat: null,
    suggestLng: null,
    suggestionMarkerLat: null,
    suggestionMarkerLng: null,
    suggestCategory: null,
  });
  const url = new URL(baseHref, "https://planner.local");
  const search = url.searchParams.toString();
  return `${pathname}/print${search ? `?${search}` : ""}`;
}

export function buildPlannerPdfHref(
  pathname: string,
  searchState: PlannerSearchState,
) {
  const baseHref = buildPlannerBaseHref(pathname, searchState, {
    view: "list",
    sidebarTab: "itinerary",
    travelFrom: null,
    travelTo: null,
    focusLat: null,
    focusLng: null,
    suggestLookup: null,
    suggestLat: null,
    suggestLng: null,
    suggestionMarkerLat: null,
    suggestionMarkerLng: null,
    suggestCategory: null,
  });
  const url = new URL(baseHref, "https://planner.local");
  const search = url.searchParams.toString();
  return `${pathname}/pdf${search ? `?${search}` : ""}`;
}

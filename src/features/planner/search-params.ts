export type PlannerView = "map" | "list";

export type PlannerSearchState = {
  view: PlannerView;
  sidebarTab: "itinerary" | "suggestions";
  from: string;
  to: string;
  filters: boolean;
  hideUnscheduledMap: boolean;
  hideStaysMap: boolean;
  suggestLookup: boolean;
  focusLat: string;
  focusLng: string;
  suggestLat: string;
  suggestLng: string;
  suggestCategory: "tourism" | "catering";
  stopId: string;
  stayId: string;
  edit: boolean;
  travelFrom: string;
  travelTo: string;
};

type RawSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

type PlannerSearchOverrides = Partial<{
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
  suggestCategory: "tourism" | "catering" | null;
  stopId: string | null;
  stayId: string | null;
  edit: boolean | null;
  travelFrom: string | null;
  travelTo: string | null;
}>;

function readValue(
  source: RawSearchParams,
  key: string,
): string | undefined {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined;
  }

  const value = source[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parsePlannerSearchParams(
  source: RawSearchParams,
): PlannerSearchState {
  const rawView = readValue(source, "view");
  const rawSidebarTab = readValue(source, "sidebarTab");
  const rawSuggestCategory = readValue(source, "suggestCategory");
  const stopId = readValue(source, "stop")?.trim() ?? "";
  const stayId = readValue(source, "stay")?.trim() ?? "";
  const travelFrom = readValue(source, "travelFrom")?.trim() ?? "";
  const travelTo = readValue(source, "travelTo")?.trim() ?? "";

  const state: PlannerSearchState = {
    view: rawView === "list" ? "list" : "map",
    sidebarTab: rawSidebarTab === "suggestions" ? "suggestions" : "itinerary",
    from: readValue(source, "from")?.trim() ?? "",
    to: readValue(source, "to")?.trim() ?? "",
    filters: readValue(source, "filters") === "1",
    hideUnscheduledMap: readValue(source, "hideUnscheduled") === "1",
    hideStaysMap: readValue(source, "hideStays") === "1",
    suggestLookup: readValue(source, "suggest") === "1",
    focusLat: readValue(source, "focusLat")?.trim() ?? "",
    focusLng: readValue(source, "focusLng")?.trim() ?? "",
    suggestLat: readValue(source, "suggestLat")?.trim() ?? "",
    suggestLng: readValue(source, "suggestLng")?.trim() ?? "",
    suggestCategory:
      rawSuggestCategory === "catering"
        ? "catering"
        : "tourism",
    stopId,
    stayId,
    edit: readValue(source, "edit") === "1",
    travelFrom,
    travelTo,
  };

  if (!state.stopId) {
    state.edit = false;
  }

  if (state.stayId) {
    state.stopId = "";
    state.edit = false;
    state.travelFrom = "";
    state.travelTo = "";
  }

  if (!state.travelFrom || !state.travelTo) {
    state.travelFrom = "";
    state.travelTo = "";
  }

  return state;
}

export function buildPlannerHref(
  pathname: string,
  current: PlannerSearchState,
  overrides: PlannerSearchOverrides = {},
) {
  const next: PlannerSearchState = {
    ...current,
    view:
      overrides.view === null || overrides.view === undefined
        ? current.view
        : overrides.view,
    sidebarTab:
      overrides.sidebarTab === null || overrides.sidebarTab === undefined
        ? current.sidebarTab
        : overrides.sidebarTab,
    from:
      overrides.from === null
        ? ""
        : overrides.from === undefined
          ? current.from
          : overrides.from,
    to:
      overrides.to === null
        ? ""
        : overrides.to === undefined
          ? current.to
          : overrides.to,
    filters:
      overrides.filters === null || overrides.filters === undefined
        ? current.filters
        : overrides.filters,
    hideUnscheduledMap:
      overrides.hideUnscheduledMap === null ||
      overrides.hideUnscheduledMap === undefined
        ? current.hideUnscheduledMap
        : overrides.hideUnscheduledMap,
    hideStaysMap:
      overrides.hideStaysMap === null ||
      overrides.hideStaysMap === undefined
        ? current.hideStaysMap
        : overrides.hideStaysMap,
    suggestLookup:
      overrides.suggestLookup === null || overrides.suggestLookup === undefined
        ? current.suggestLookup
        : overrides.suggestLookup,
    focusLat:
      overrides.focusLat === null
        ? ""
        : overrides.focusLat === undefined
          ? current.focusLat
          : overrides.focusLat,
    focusLng:
      overrides.focusLng === null
        ? ""
        : overrides.focusLng === undefined
          ? current.focusLng
          : overrides.focusLng,
    suggestLat:
      overrides.suggestLat === null
        ? ""
        : overrides.suggestLat === undefined
          ? current.suggestLat
          : overrides.suggestLat,
    suggestLng:
      overrides.suggestLng === null
        ? ""
        : overrides.suggestLng === undefined
          ? current.suggestLng
          : overrides.suggestLng,
    suggestCategory:
      overrides.suggestCategory === null || overrides.suggestCategory === undefined
        ? current.suggestCategory
        : overrides.suggestCategory,
    stopId:
      overrides.stopId === null
        ? ""
        : overrides.stopId === undefined
          ? current.stopId
          : overrides.stopId,
    stayId:
      overrides.stayId === null
        ? ""
        : overrides.stayId === undefined
          ? current.stayId
          : overrides.stayId,
    edit:
      overrides.edit === null || overrides.edit === undefined
        ? current.edit
        : overrides.edit,
    travelFrom:
      overrides.travelFrom === null
        ? ""
        : overrides.travelFrom === undefined
          ? current.travelFrom
          : overrides.travelFrom,
    travelTo:
      overrides.travelTo === null
        ? ""
        : overrides.travelTo === undefined
          ? current.travelTo
          : overrides.travelTo,
  };

  if (!next.stopId) {
    next.edit = false;
  }

  if (next.stayId) {
    next.stopId = "";
    next.edit = false;
    next.travelFrom = "";
    next.travelTo = "";
  }

  if (!next.travelFrom || !next.travelTo) {
    next.travelFrom = "";
    next.travelTo = "";
  }

  const query = new URLSearchParams();
  if (next.view !== "map") query.set("view", next.view);
  if (next.sidebarTab !== "itinerary") query.set("sidebarTab", next.sidebarTab);
  if (next.from) query.set("from", next.from);
  if (next.to) query.set("to", next.to);
  if (next.filters) query.set("filters", "1");
  if (next.hideUnscheduledMap) query.set("hideUnscheduled", "1");
  if (next.hideStaysMap) query.set("hideStays", "1");
  if (next.suggestLookup) query.set("suggest", "1");
  if (next.focusLat && next.focusLng) {
    query.set("focusLat", next.focusLat);
    query.set("focusLng", next.focusLng);
  }
  if (next.suggestLat && next.suggestLng) {
    query.set("suggestLat", next.suggestLat);
    query.set("suggestLng", next.suggestLng);
  }
  if (next.suggestCategory !== "tourism") {
    query.set("suggestCategory", next.suggestCategory);
  }
  if (next.stopId) {
    query.set("stop", next.stopId);
    if (next.edit) {
      query.set("edit", "1");
    }
  }
  if (next.stayId) {
    query.set("stay", next.stayId);
  }
  if (next.travelFrom && next.travelTo) {
    query.set("travelFrom", next.travelFrom);
    query.set("travelTo", next.travelTo);
  }

  const search = query.toString();
  return search ? `${pathname}?${search}` : pathname;
}

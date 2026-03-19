export type PlannerView = "map" | "list";

export type PlannerSearchState = {
  view: PlannerView;
  from: string;
  to: string;
  filters: boolean;
  stopId: string;
  stayId: string;
  arrivalIndex: number;
  edit: boolean;
  travelFrom: string;
  travelTo: string;
};

type RawSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

type PlannerSearchOverrides = Partial<{
  view: PlannerView | null;
  from: string | null;
  to: string | null;
  filters: boolean | null;
  stopId: string | null;
  stayId: string | null;
  arrivalIndex: number | null;
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
  const rawArrivalIndex = Number(readValue(source, "arrival"));
  const stopId = readValue(source, "stop")?.trim() ?? "";
  const stayId = readValue(source, "stay")?.trim() ?? "";
  const travelFrom = readValue(source, "travelFrom")?.trim() ?? "";
  const travelTo = readValue(source, "travelTo")?.trim() ?? "";

  const state: PlannerSearchState = {
    view: rawView === "list" ? "list" : "map",
    from: readValue(source, "from")?.trim() ?? "",
    to: readValue(source, "to")?.trim() ?? "",
    filters: readValue(source, "filters") === "1",
    stopId,
    stayId,
    arrivalIndex:
      Number.isInteger(rawArrivalIndex) && rawArrivalIndex >= 0
        ? rawArrivalIndex
        : 0,
    edit: readValue(source, "edit") === "1",
    travelFrom,
    travelTo,
  };

  if (!state.stopId) {
    state.edit = false;
    state.arrivalIndex = 0;
  }

  if (state.stayId) {
    state.stopId = "";
    state.edit = false;
    state.arrivalIndex = 0;
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
    arrivalIndex:
      overrides.arrivalIndex === null || overrides.arrivalIndex === undefined
        ? current.arrivalIndex
        : overrides.arrivalIndex,
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
    next.arrivalIndex = 0;
  }

  if (next.stayId) {
    next.stopId = "";
    next.edit = false;
    next.arrivalIndex = 0;
    next.travelFrom = "";
    next.travelTo = "";
  }

  if (!next.travelFrom || !next.travelTo) {
    next.travelFrom = "";
    next.travelTo = "";
  }

  const query = new URLSearchParams();
  if (next.view !== "map") query.set("view", next.view);
  if (next.from) query.set("from", next.from);
  if (next.to) query.set("to", next.to);
  if (next.filters) query.set("filters", "1");
  if (next.stopId) {
    query.set("stop", next.stopId);
    if (next.arrivalIndex > 0) {
      query.set("arrival", String(next.arrivalIndex));
    }
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

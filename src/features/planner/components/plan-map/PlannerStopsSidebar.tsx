"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  List,
  PanelLeftClose,
  PanelLeftOpen,
  BedDouble,
  Loader2,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildPlannerHref,
  type PlannerSearchState,
} from "@/features/planner/search-params";
import type {
  Stop,
} from "@/features/planner/components/plan-map/types";
import type {
  PlannerSuggestionCategory,
  PlannerSuggestionItem,
} from "@/features/planner/geoapify";
import type { TripStayItem } from "@/types/trip-logistics";
import { cn } from "@/lib/utils";

type SharedProps = {
  pathname: string;
  searchState: PlannerSearchState;
  stops: Stop[];
  unscheduledStops: Stop[];
  stays: TripStayItem[];
  suggestions: PlannerSuggestionItem[];
  suggestionCategory: PlannerSuggestionCategory;
  defaultSuggestionCenter: { lat: number; lng: number } | null;
  onStopSelect?: (stop: Stop) => void;
  onStaySelect?: (stay: TripStayItem) => void;
  onSuggestionSelect?: (suggestion: PlannerSuggestionItem) => void;
};

type ToggleProps = {
  open: boolean;
  onToggle: () => void;
};

function useGroupedStops(stops: Stop[]) {
  return useMemo(() => {
    const groups = new Map<string, Stop[]>();
    for (const stop of stops) {
      const list = groups.get(stop.date) ?? [];
      list.push(stop);
      groups.set(stop.date, list);
    }
    return [...groups.entries()];
  }, [stops]);
}

function SidebarContent({
  pathname,
  searchState,
  stops,
  unscheduledStops,
  stays,
  suggestions,
  suggestionCategory,
  defaultSuggestionCenter,
  onStopSelect,
  onStaySelect,
  onSuggestionSelect,
}: SharedProps) {
  const groupedStops = useGroupedStops(stops);
  const router = useRouter();
  const [isLookingSuggestions, startLookingSuggestions] = useTransition();

  const detailedListHref = buildPlannerHref(pathname, searchState, {
    view: "list",
    stopId: null,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });
  const tourismHref = buildPlannerHref(pathname, searchState, {
    suggestCategory: "tourism",
    suggestLookup: false,
  });
  const cateringHref = buildPlannerHref(pathname, searchState, {
    suggestCategory: "catering",
    suggestLookup: false,
  });
  const effectiveSuggestionCenter =
    searchState.focusLat && searchState.focusLng
      ? { lat: Number(searchState.focusLat), lng: Number(searchState.focusLng) }
      : defaultSuggestionCenter;
  const canLookupSuggestions =
    effectiveSuggestionCenter &&
    Number.isFinite(effectiveSuggestionCenter.lat) &&
    Number.isFinite(effectiveSuggestionCenter.lng);
  const lookSuggestionsHref = canLookupSuggestions
    ? buildPlannerHref(pathname, searchState, {
        suggestLookup: true,
        suggestLat: String(effectiveSuggestionCenter.lat),
        suggestLng: String(effectiveSuggestionCenter.lng),
      })
    : null;

  return (
    <div className="flex w-full h-full flex-col bg-card">
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-4">
        <Tabs
          value={searchState.sidebarTab}
          onValueChange={(value) =>
            router.replace(
              buildPlannerHref(pathname, searchState, {
                sidebarTab:
                  value === "suggestions" ? "suggestions" : "itinerary",
              }),
            )
          }
          className="mt-1"
        >
          <TabsList className="w-full">
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="mt-2 space-y-2">
            {groupedStops.map(([date, dateStops]) => (
              <details
                key={date}
                open
                className="group block w-full rounded-xl border border-border bg-background/75 px-2 py-2"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary/70" />
                    <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {date}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 space-y-0.5">
                  {dateStops.map((stop) => {
                    const isActive = searchState.stopId === stop._id;

                    return (
                      <button
                        key={stop._id}
                        type="button"
                        onClick={() => onStopSelect?.(stop)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted text-foreground",
                        )}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-[9px] font-bold text-primary">
                          {stop.order}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium leading-4">
                            {stop.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {stop.displayTime ? stop.time : "No time"}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      </button>
                    );
                  })}
                </div>
              </details>
            ))}
            <details
              open
              className="group block w-full rounded-xl border border-border bg-background/75 px-2 py-2"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1">
                <div className="flex min-w-0 items-center gap-2">
                  <List className="h-3.5 w-3.5 text-primary/70" />
                  <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Unscheduled Stops
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2 space-y-0.5">
                {unscheduledStops.length === 0 ? (
                  <p className="px-2.5 py-2 text-xs text-muted-foreground">
                    No unscheduled stops
                  </p>
                ) : (
                  unscheduledStops.map((stop) => {
                    const isActive = searchState.stopId === stop._id;

                    return (
                      <button
                        key={stop._id}
                        type="button"
                        onClick={() => onStopSelect?.(stop)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted text-foreground",
                        )}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-[9px] font-bold text-primary">
                          {stop.order}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium leading-4">
                            {stop.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            Save for later
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      </button>
                    );
                  })
                )}
              </div>
            </details>

            <details
              open
              className="group block w-full rounded-xl border border-border bg-background/75 px-2 py-2"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1">
                <div className="flex min-w-0 items-center gap-2">
                  <BedDouble className="h-3.5 w-3.5 text-primary/70" />
                  <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Stays
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2 space-y-0.5">
                {stays.length === 0 ? (
                  <p className="px-2.5 py-2 text-xs text-muted-foreground">
                    No stays added
                  </p>
                ) : (
                  stays.map((stay) => {
                    const isActive = searchState.stayId === stay._id;

                    return (
                      <button
                        key={stay._id}
                        type="button"
                        onClick={() => onStaySelect?.(stay)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted text-foreground",
                        )}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-primary">
                          <BedDouble className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium leading-4">
                            {stay.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {stay.checkInDate} → {stay.checkOutDate}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      </button>
                    );
                  })
                )}
              </div>
            </details>
          </TabsContent>

          <TabsContent value="suggestions" className="mt-2 space-y-3">
            <div className="rounded-xl border border-border bg-background/75 p-2">
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link href={tourismHref} className="block">
                  <Button
                    type="button"
                    variant={
                      suggestionCategory === "tourism" ? "default" : "outline"
                    }
                    className="w-full rounded-xl justify-start"
                  >
                    <Sparkles className="h-4 w-4" />
                    Tourism
                  </Button>
                </Link>
                <Link href={cateringHref} className="block">
                  <Button
                    type="button"
                    variant={
                      suggestionCategory === "catering"
                        ? "default"
                        : "outline"
                    }
                    className="w-full rounded-xl justify-start"
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                    Catering
                  </Button>
                </Link>
              </div>
              <div className="mt-2">
                {lookSuggestionsHref ? (
                  <Button
                    type="button"
                    className="w-full rounded-xl"
                    disabled={isLookingSuggestions}
                    onClick={() =>
                      startLookingSuggestions(() => {
                        router.replace(lookSuggestionsHref);
                      })
                    }
                  >
                    {isLookingSuggestions ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Looking...
                      </>
                    ) : (
                      "Look for suggestions"
                    )}
                  </Button>
                ) : (
                  <Button type="button" className="w-full rounded-xl" disabled>
                    Look for suggestions
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/75">             
              <div className="max-h-[18rem] overflow-y-auto p-2 space-y-1">
                {!searchState.suggestLookup ? (
                  <p className="px-2.5 py-3 text-xs text-muted-foreground">
                    Pick a point on the map or from the itinerary, then look for suggestions.
                  </p>
                ) : suggestions.length === 0 ? (
                  <p className="px-2.5 py-3 text-xs text-muted-foreground">
                    No suggestions found for this area.
                  </p>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => onSuggestionSelect?.(suggestion)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted text-foreground"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-primary">
                        {suggestionCategory === "tourism" ? (
                          <Sparkles className="h-3.5 w-3.5" />
                        ) : (
                          <UtensilsCrossed className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium leading-4">
                          {suggestion.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {suggestion.address}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t border-border p-4">
        <Link href={detailedListHref}>
          <Button variant="outline" className="w-full rounded-xl">
            <List className="mr-2 h-4 w-4" />
            View detailed list
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function PlannerStopsSidebarDesktopToggle({
  open,
  onToggle,
}: ToggleProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="hidden h-11 w-11 rounded-2xl bg-card/95 shadow-lg backdrop-blur md:inline-flex"
      onClick={onToggle}
    >
      {open ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <PanelLeftOpen className="h-4 w-4" />
      )}
    </Button>
  );
}

export function PlannerStopsSidebarDesktopPanel({
  pathname,
  searchState,
  stops,
  unscheduledStops,
  stays,
  suggestions,
  suggestionCategory,
  defaultSuggestionCenter,
  open,
  onStopSelect,
  onStaySelect,
  onSuggestionSelect,
}: SharedProps & { open: boolean }) {
  return (
    <aside
      aria-hidden={!open}
      className={cn(
        "absolute left-3 top-[4.25rem] bottom-4 z-20 hidden w-[22rem] overflow-hidden rounded-3xl border border-border bg-card/95 shadow-2xl backdrop-blur transition-all duration-200 ease-out md:flex",
        open
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "pointer-events-none -translate-x-4 opacity-0",
      )}
    >
      <SidebarContent
        pathname={pathname}
        searchState={searchState}
        stops={stops}
        unscheduledStops={unscheduledStops}
        stays={stays}
        suggestions={suggestions}
        suggestionCategory={suggestionCategory}
        defaultSuggestionCenter={defaultSuggestionCenter}
        onStopSelect={onStopSelect}
        onStaySelect={onStaySelect}
        onSuggestionSelect={onSuggestionSelect}
      />
    </aside>
  );
}

export function PlannerStopsSidebarMobile({
  pathname,
  searchState,
  stops,
  unscheduledStops,
  stays,
  suggestions,
  suggestionCategory,
  defaultSuggestionCenter,
  onStopSelect,
  onStaySelect,
  onSuggestionSelect,
}: SharedProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-2xl bg-card/95 shadow-lg backdrop-blur md:hidden"
          />
        }
      >
        <PanelLeftOpen className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Stops</SheetTitle>
        </SheetHeader>
        <SidebarContent
          pathname={pathname}
          searchState={searchState}
          stops={stops}
          unscheduledStops={unscheduledStops}
          stays={stays}
          suggestions={suggestions}
          suggestionCategory={suggestionCategory}
          defaultSuggestionCenter={defaultSuggestionCenter}
          onStopSelect={onStopSelect}
          onStaySelect={onStaySelect}
          onSuggestionSelect={onSuggestionSelect}
        />
      </SheetContent>
    </Sheet>
  );
}

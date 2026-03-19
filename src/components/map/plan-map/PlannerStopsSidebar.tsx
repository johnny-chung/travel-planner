"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  List,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  buildPlannerHref,
  type PlannerSearchState,
} from "@/features/planner/search-params";
import { expandStops } from "@/components/map/plan-map/utils";
import type { Stop } from "@/components/map/plan-map/types";
import { cn } from "@/lib/utils";

type SharedProps = {
  pathname: string;
  searchState: PlannerSearchState;
  stops: Stop[];
  onStopSelect?: (stop: Stop) => void;
};

type ToggleProps = {
  open: boolean;
  onToggle: () => void;
};

function useGroupedStops(stops: Stop[]) {
  return useMemo(() => {
    const groups = new Map<string, Stop[]>();
    for (const stop of expandStops(stops)) {
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
  onStopSelect,
}: SharedProps) {
  const groupedStops = useGroupedStops(stops);

  const detailedListHref = buildPlannerHref(pathname, searchState, {
    view: "list",
    stopId: null,
    arrivalIndex: 0,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });

  return (
    <div className="flex w-full h-full flex-col bg-card">
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-4">
        <div className="mt-1 space-y-2">
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
                  const isActive =
                    searchState.stopId === stop._id &&
                    (searchState.arrivalIndex ?? 0) ===
                      (stop._arrivalIndex ?? 0);

                  return (
                    <button
                      key={`${stop._id}-${stop._arrivalIndex ?? 0}`}
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
        </div>
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
  open,
  onStopSelect,
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
        onStopSelect={onStopSelect}
      />
    </aside>
  );
}

export function PlannerStopsSidebarMobile({
  pathname,
  searchState,
  stops,
  onStopSelect,
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
          onStopSelect={onStopSelect}
        />
      </SheetContent>
    </Sheet>
  );
}

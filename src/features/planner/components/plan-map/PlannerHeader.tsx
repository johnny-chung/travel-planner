"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  List,
  Loader2,
  Map as MapIcon,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildPlannerHref, type PlannerSearchState } from "@/features/planner/search-params";

type Props = {
  pathname: string;
  planName: string;
  stopCount: number;
  searchState: PlannerSearchState;
  isArchived: boolean;
  backHref?: string;
};

export default function PlannerHeader({
  pathname,
  planName,
  stopCount,
  searchState,
  isArchived,
  backHref = "/plans",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const mapHref = buildPlannerHref(pathname, searchState, {
    view: "map",
    stopId: null,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });
  const listHref = buildPlannerHref(pathname, searchState, {
    view: "list",
    stopId: null,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });
  const filterHref = buildPlannerHref(pathname, searchState, {
    filters: !searchState.filters,
  });

  return (
    <>
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 z-10 shadow-sm flex-shrink-0">
        <div className="w-full max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href={backHref}
            className="p-1.5 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground truncate text-base">
              {planName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {stopCount} stop{stopCount !== 1 ? "s" : ""}
            </p>
          </div>

          <Link
            href={filterHref}
            className={cn(
              "p-2 rounded-xl transition-colors",
              searchState.filters || searchState.from || searchState.to
                ? "bg-primary/20 text-primary"
                : "hover:bg-muted text-muted-foreground",
            )}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Link>

          <div className="rounded-xl bg-muted p-1 h-9 w-40 flex items-center">
            <button
              type="button"
              onClick={() =>
                startTransition(() => {
                  router.push(mapHref);
                })
              }
              className={cn(
                "flex-1 rounded-lg gap-1.5 text-sm h-7 inline-flex items-center justify-center font-medium",
                searchState.view === "map"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isPending && searchState.view !== "map" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapIcon className="w-4 h-4" />
              )}{" "}
              Map
            </button>
            <button
              type="button"
              onClick={() =>
                startTransition(() => {
                  router.push(listHref);
                })
              }
              className={cn(
                "flex-1 rounded-lg gap-1.5 text-sm h-7 inline-flex items-center justify-center font-medium",
                searchState.view === "list"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isPending && searchState.view !== "list" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <List className="w-4 h-4" />
              )}{" "}
              List
            </button>
          </div>
        </div>
      </div>

      {isArchived ? (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 text-yellow-800 text-sm flex-shrink-0">
          <Archive className="w-4 h-4 flex-shrink-0" />
          This trip is archived. Add and delete actions are disabled.
        </div>
      ) : null}
    </>
  );
}

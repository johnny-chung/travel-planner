"use client";

import { useActionState, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bus, Car, ExternalLink, Footprints, PersonStanding } from "lucide-react";
import {
  calculateTravelTimeAction,
  type TravelTimeActionState,
} from "@/features/travel-times/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { getClientDictionary } from "@/features/i18n/client";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import type {
  PlannerRouteNode,
  TravelStepDetail,
  TravelTimeEntry,
} from "@/features/planner/components/plan-map/types";

type TravelMode = "TRANSIT" | "DRIVE" | "WALK";

type Props = {
  tripId: string;
  fromNode: PlannerRouteNode;
  toNode: PlannerRouteNode;
  currentMode: TravelMode;
  currentTravelTime?: TravelTimeEntry | null;
  currentHref: string;
  closeHref: string;
};

const initialState: TravelTimeActionState = {};

type DisplayStep = {
  key: string;
  type: TravelStepDetail["type"];
  label: string;
  durationMinutes: number;
  distanceMeters?: number | null;
  departureStop?: string;
  arrivalStop?: string;
  headsign?: string;
  mapsUrl?: string;
};

function formatDistance(distanceMeters?: number | null) {
  if (!distanceMeters || distanceMeters <= 0) return "";
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(distanceMeters >= 10000 ? 0 : 1)} km`;
}

function buildDirectionsUrl(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number,
  mode: TravelMode,
) {
  const travelMode =
    mode === "DRIVE" ? "driving" : mode === "WALK" ? "walking" : "transit";
  const params = new URLSearchParams({
    api: "1",
    origin: `${originLat},${originLng}`,
    destination: `${destinationLat},${destinationLng}`,
    travelmode: travelMode,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildPlaceSearchUrl(query: string) {
  const params = new URLSearchParams({
    api: "1",
    query,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function groupTransitDetails(
  details: TravelStepDetail[] | undefined,
  finalDestinationLabel: string,
): DisplayStep[] {
  if (!details || details.length === 0) {
    return [];
  }

  const grouped: DisplayStep[] = [];
  let pendingWalkDuration = 0;
  let pendingWalkDistance = 0;

  function flushWalk(nextStep?: TravelStepDetail) {
    if (pendingWalkDuration <= 0 && pendingWalkDistance <= 0) {
      return;
    }

    const targetLabel = nextStep?.departureStop?.trim() || finalDestinationLabel;
    grouped.push({
      key: `walk-${grouped.length}`,
      type: "WALK",
      label: `Walk to ${targetLabel}`,
      durationMinutes: pendingWalkDuration,
      distanceMeters: pendingWalkDistance > 0 ? pendingWalkDistance : null,
      mapsUrl: buildPlaceSearchUrl(targetLabel),
    });

    pendingWalkDuration = 0;
    pendingWalkDistance = 0;
  }

  for (let index = 0; index < details.length; index += 1) {
    const step = details[index];
    if (step.type === "WALK") {
      pendingWalkDuration += step.durationMinutes;
      pendingWalkDistance += step.distanceMeters ?? 0;
      continue;
    }

    flushWalk(step);
    grouped.push({
      key: `${step.type}-${step.label}-${index}`,
      type: step.type,
      label: step.label,
      durationMinutes: step.durationMinutes,
      distanceMeters: step.distanceMeters,
      departureStop: step.departureStop,
      arrivalStop: step.arrivalStop,
      headsign: step.headsign,
    });
  }

  flushWalk();
  return grouped;
}

function StepRow({ step }: { step: DisplayStep }) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const Icon =
    step.type === "TRANSIT" ? Bus : step.type === "DRIVE" ? Car : PersonStanding;
  return (
    <div className="border-t border-border pt-2 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{step.label}</p>
              {step.type === "TRANSIT" && (step.departureStop || step.arrivalStop) ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[step.departureStop, step.arrivalStop].filter(Boolean).join(" -> ")}
                </p>
              ) : null}
              {step.headsign ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dictionary.planner.towards.replace("{headsign}", step.headsign)}
                </p>
              ) : null}
              {step.mapsUrl ? (
                <a
                  href={step.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  {dictionary.planner.openInGoogleMaps}
                </a>
              ) : null}
            </div>
            <div className="text-right text-xs text-muted-foreground shrink-0">
              <p>{step.durationMinutes} min</p>
              {step.distanceMeters ? <p>{formatDistance(step.distanceMeters)}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModeEditSheet({
  tripId,
  fromNode,
  toNode,
  currentMode,
  currentTravelTime,
  currentHref,
  closeHref,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const [state, formAction] = useActionState(
    calculateTravelTimeAction,
    initialState,
  );
  const modes: { value: TravelMode; label: string; Icon: React.ElementType }[] = [
    { value: "TRANSIT", label: dictionary.planner.transit, Icon: Bus },
    { value: "DRIVE", label: dictionary.planner.drive, Icon: Car },
    { value: "WALK", label: dictionary.planner.walk, Icon: Footprints },
  ];
  const [selected, setSelected] = useState<TravelMode>(currentMode);
  const currentRouteMode = currentTravelTime?.mode ?? currentMode;
  const directionsUrl = useMemo(
    () =>
      buildDirectionsUrl(
        fromNode.lat,
        fromNode.lng,
        toNode.lat,
        toNode.lng,
        currentRouteMode,
      ),
    [currentRouteMode, fromNode.lat, fromNode.lng, toNode.lat, toNode.lng],
  );
  const groupedTransitDetails = useMemo(
    () => groupTransitDetails(currentTravelTime?.details, toNode.name || "destination"),
    [currentTravelTime?.details, toNode.name],
  );
  const showOnlySummary =
    currentRouteMode === "DRIVE" || currentRouteMode === "WALK";

  return (
    <Dialog open={true} onOpenChange={(open) => !open && router.push(closeHref)}>
      <DialogContent className="rounded-3xl mx-4 max-w-sm">
        <DialogHeader>
          <DialogTitle>{dictionary.planner.routeDetail}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="returnTo" value={currentHref} />
          <input type="hidden" name="fromNodeId" value={fromNode.id} />
          <input type="hidden" name="toNodeId" value={toNode.id} />
          <input type="hidden" name="fromLat" value={fromNode.lat} />
          <input type="hidden" name="fromLng" value={fromNode.lng} />
          <input type="hidden" name="toLat" value={toNode.lat} />
          <input type="hidden" name="toLng" value={toNode.lng} />
          <input type="hidden" name="toDate" value={toNode.date} />
          <input type="hidden" name="toTime" value={toNode.time} />
          <input type="hidden" name="mode" value={selected} />
          <p className="text-sm text-muted-foreground -mt-1 truncate">
            {fromNode.name} → {toNode.name}
          </p>
          {currentTravelTime ? (
            <div className="rounded-2xl bg-muted/40 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {dictionary.planner.currentRoute}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {currentTravelTime.summary || `${currentTravelTime.durationMinutes} min`}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <p>{currentTravelTime.durationMinutes} min</p>
                  {currentRouteMode !== "WALK" && currentTravelTime.distanceMeters ? (
                    <p>{formatDistance(currentTravelTime.distanceMeters)}</p>
                  ) : null}
                </div>
              </div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-center rounded-xl",
                )}
              >
                <ExternalLink className="w-4 h-4" />
                {dictionary.planner.openDirections}
              </a>
              {!showOnlySummary && groupedTransitDetails.length > 0 ? (
                <div className="space-y-2">
                  {groupedTransitDetails.map((step) => (
                    <StepRow key={step.key} step={step} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-3 py-2">
            {modes.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelected(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${
                  selected === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-border/80"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
          {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
          <DialogFooter className="gap-2 flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => router.push(closeHref)}
            >
              {dictionary.planner.cancel}
            </Button>
            <SubmitButton
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
              pendingLabel={dictionary.planner.confirming}
            >
              {dictionary.planner.confirm}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

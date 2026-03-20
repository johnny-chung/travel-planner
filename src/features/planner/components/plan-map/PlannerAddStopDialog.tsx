"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import AddStopModal from "@/features/planner/components/stops/AddStopModal";
import type {
  PendingLocation,
  TripDoc,
} from "@/features/planner/components/plan-map/types";
import PlaceSearchInput from "@/features/places/components/PlaceSearchInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  tripId: string;
  tripDates?: string[];
  tripDocs: TripDoc[];
  returnTo: string;
  apiKey: string;
  accessMode?: "user" | "guest";
  disabled?: boolean;
  triggerClassName?: string;
  iconOnly?: boolean;
};

export default function PlannerAddStopDialog({
  tripId,
  tripDates = [],
  tripDocs,
  returnTo,
  apiKey,
  accessMode = "user",
  disabled = false,
  triggerClassName,
  iconOnly = true,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(
    null,
  );

  const resetSearch = useCallback(() => {
    setQuery("");
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setDialogOpen(nextOpen);
      if (!nextOpen) {
        resetSearch();
      }
    },
    [resetSearch],
  );

  function handleSelect(nextLocation: PendingLocation) {
    fetch("/api/usage/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "places" }),
    }).catch(() => {});

    resetSearch();
    setDialogOpen(false);
    setPendingLocation(nextLocation);
  }

  return (
    <>
      <Button
        type="button"
        size={iconOnly ? "icon-lg" : "default"}
        className={triggerClassName}
        onClick={() => handleOpenChange(true)}
        disabled={disabled}
        aria-label="Add stop"
        title="Add stop"
      >
        <Plus className="w-5 h-5" />
        {iconOnly ? null : <span>Add Stop</span>}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-3xl mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle>Add a stop</DialogTitle>
            <DialogDescription>
              Search for a place first, then optionally assign a date and time
              in the next step.
            </DialogDescription>
          </DialogHeader>

          {!apiKey ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              Google Maps is not configured. Add{" "}
              <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to use place search.
            </p>
          ) : (
            <PlaceSearchInput
              apiKey={apiKey}
              value={query}
              onChange={setQuery}
              onSelect={handleSelect}
              placeholder="Search by address or place"
              autoFocus
            />
          )}
        </DialogContent>
      </Dialog>

      {pendingLocation ? (
        <AddStopModal
          tripId={tripId}
          location={pendingLocation}
          tripDates={tripDates}
          tripDocs={tripDocs}
          returnTo={returnTo}
          onCancel={() => setPendingLocation(null)}
          accessMode={accessMode}
        />
      ) : null}
    </>
  );
}

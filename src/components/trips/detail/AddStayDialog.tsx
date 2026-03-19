"use client";

import { useActionState, useEffect, useState } from "react";
import {
  addStayAction,
  type TripLogisticsActionState,
} from "@/features/trip-logistics/actions";
import type { PendingLocation } from "@/components/map/plan-map/types";
import PlaceSearchInput from "@/components/places/PlaceSearchInput";
import SubmitButton from "@/components/shared/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  tripId: string;
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: TripLogisticsActionState = {};

export default function AddStayDialog({
  tripId,
  apiKey,
  open,
  onOpenChange,
}: Props) {
  const [state, formAction] = useActionState(addStayAction, initialState);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<PendingLocation | null>(null);
  const [relaxedSearch, setRelaxedSearch] = useState(false);

  function resetForm() {
    setQuery("");
    setLocation(null);
    setRelaxedSearch(false);
  }

  useEffect(() => {
    if (!state.success) return;
    onOpenChange(false);
  }, [onOpenChange, state.success]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent className="rounded-3xl mx-4 max-w-md">
        <DialogHeader>
          <DialogTitle>Add stay</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="name" value={location?.name ?? ""} />
          <input type="hidden" name="address" value={location?.address ?? ""} />
          <input type="hidden" name="placeId" value={location?.placeId ?? ""} />
          <input type="hidden" name="lat" value={location?.lat ?? ""} />
          <input type="hidden" name="lng" value={location?.lng ?? ""} />
          <input
            type="hidden"
            name="thumbnail"
            value={location?.thumbnail ?? ""}
          />
          <input type="hidden" name="phone" value={location?.phone ?? ""} />
          <input type="hidden" name="website" value={location?.website ?? ""} />

          <div className="space-y-1.5">
            <Label>Lodging</Label>
            <PlaceSearchInput
              apiKey={apiKey}
              value={query}
              onChange={(value) => {
                setQuery(value);
                setLocation(null);
              }}
              onSelect={(selectedLocation) => {
                setQuery(selectedLocation.name);
                setLocation(selectedLocation);
              }}
              placeholder="Search for a hotel or stay"
              includedPrimaryTypes={relaxedSearch ? undefined : ["lodging"]}
              autoFocus
            />
            {!relaxedSearch ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto px-0 py-1 text-xs text-blue-600 hover:text-blue-500"
                onClick={() => setRelaxedSearch(true)}
              >
                Not found? Search all place types
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Showing broader place suggestions now.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Check-in</Label>
              <Input
                type="date"
                name="checkInDate"
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Check-out</Label>
              <Input
                type="date"
                name="checkOutDate"
                className="rounded-xl h-11"
              />
            </div>
          </div>

          {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}

          <DialogFooter className="gap-2 flex-row mt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <SubmitButton className="flex-1 rounded-xl" pendingLabel="Adding...">
              Add
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Route } from "lucide-react";
import {
  calculateAllTravelTimesAction,
  type TravelTimeActionState,
} from "@/features/travel-times/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SubmitButton from "@/components/shared/SubmitButton";
import { useActionState } from "react";

type Props = {
  tripId: string;
  returnTo: string;
  disabled?: boolean;
  triggerClassName?: string;
  iconOnly?: boolean;
};

export default function CalculateTravelTimesDialog({
  tripId,
  returnTo,
  disabled = false,
  triggerClassName,
  iconOnly = false,
}: Props) {
  const [state, formAction] = useActionState<TravelTimeActionState, FormData>(
    calculateAllTravelTimesAction,
    {},
  );
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="outline"
        size={iconOnly ? "icon-lg" : "default"}
        className={triggerClassName}
        title="Calculate travel times"
        disabled={disabled}
      >
        <Route className="w-5 h-5" />
        {iconOnly ? null : <span>Calculate</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle>Calculate Travel Times</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="tripId" value={tripId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <p className="text-sm text-muted-foreground">
              Please ensure all your stops and times are finalised. Travel
              times will be calculated between consecutive stops on the same
              day.
            </p>
            <p className="text-xs text-muted-foreground">
              This uses 1 of your monthly calculation credits.
            </p>
            {state.error ? (
              <p className="text-sm text-red-500">{state.error}</p>
            ) : null}
            <DialogFooter className="gap-2 flex-row mt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                pendingLabel={
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Calculating...
                  </>
                }
              >
                Calculate
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

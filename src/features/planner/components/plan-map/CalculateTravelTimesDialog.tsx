"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Route } from "lucide-react";
import {
  calculateAllTravelTimesAction,
  type TravelTimeActionState,
} from "@/features/travel-times/actions";
import SignupGateDialog from "@/features/shared/components/SignupGateDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { useActionState } from "react";
import { getClientDictionary } from "@/features/i18n/client";

type Props = {
  tripId: string;
  returnTo: string;
  disabled?: boolean;
  restricted?: boolean;
  triggerClassName?: string;
  iconOnly?: boolean;
};

export default function CalculateTravelTimesDialog({
  tripId,
  returnTo,
  disabled = false,
  restricted = false,
  triggerClassName,
  iconOnly = false,
}: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const [state, formAction] = useActionState<TravelTimeActionState, FormData>(
    calculateAllTravelTimesAction,
    {},
  );
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          if (restricted) {
            setOpen(true);
            return;
          }
          setOpen(true);
        }}
        variant="outline"
        size={iconOnly ? "icon-lg" : "default"}
        className={triggerClassName}
        title={dictionary.planner.calculateTravelTimes}
        disabled={disabled}
      >
        <Route className="w-5 h-5" />
        {iconOnly ? null : <span>{dictionary.planner.calculate}</span>}
      </Button>
      {restricted ? (
        <SignupGateDialog
          open={open}
          onOpenChange={setOpen}
          title={dictionary.planner.signupToCalculateTitle}
          description={dictionary.planner.signupToCalculateDescription}
        />
      ) : (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle>{dictionary.planner.calculateTravelTimes}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="tripId" value={tripId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <p className="text-sm text-muted-foreground">
              {dictionary.planner.calculateDialogBody}
            </p>
            <p className="text-xs text-muted-foreground">
              {dictionary.planner.calculateCredits}
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
                {dictionary.planner.cancel}
              </Button>
              <SubmitButton
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                pendingLabel={
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    {dictionary.planner.calculating}
                  </>
                }
              >
                {dictionary.planner.calculate}
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}

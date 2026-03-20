"use client";

import { useActionState, useEffect } from "react";
import {
  addTripDocumentAction,
  type FormActionState,
} from "@/features/trips/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: FormActionState = {};

export default function AddTripDocumentDialog({ tripId, open, onOpenChange }: Props) {
  const [state, formAction] = useActionState<FormActionState, FormData>(
    addTripDocumentAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [onOpenChange, state.success]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="rounded-3xl mx-4 max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="tripId" value={tripId} />
          <p className="text-muted-foreground text-sm">
            Paste a Google Drive or Google Docs share link.
          </p>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              name="name"
              placeholder="e.g. Itinerary Draft"
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Link</Label>
            <Input
              name="url"
              placeholder="https://docs.google.com/..."
              className="rounded-xl h-11"
            />
          </div>
          {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
          <DialogFooter className="gap-2 flex-row mt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton
              className="flex-1 rounded-xl"
              pendingLabel="Adding..."
            >
              Add
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

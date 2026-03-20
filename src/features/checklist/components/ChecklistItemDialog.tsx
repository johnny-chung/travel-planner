"use client";

import { useActionState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SubmitButton from "@/features/shared/components/SubmitButton";
import type { ChecklistItem } from "@/features/checklist/types";
import type { ChecklistActionState } from "@/features/checklist/actions";

type Props = {
  tripId: string;
  returnTo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ChecklistItem | null;
  action: (
    state: ChecklistActionState,
    formData: FormData,
  ) => Promise<ChecklistActionState>;
};

const initialState: ChecklistActionState = {};

export default function ChecklistItemDialog({
  tripId,
  returnTo,
  open,
  onOpenChange,
  item,
  action,
}: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const title = item ? "Edit checklist item" : "Add checklist item";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          {item ? <input type="hidden" name="itemId" value={item._id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="checklist-text">Item</Label>
            <Textarea
              id="checklist-text"
              name="text"
              defaultValue={item?.text ?? ""}
              placeholder="Passport, charger, train ticket..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checklist-checked-by">Checked by / remark</Label>
            <Input
              id="checklist-checked-by"
              name="checkedBy"
              defaultValue={item?.checkedBy ?? ""}
              placeholder="John packed this"
            />
          </div>

          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <div className="flex justify-end">
            <SubmitButton pendingLabel="Saving...">{item ? "Save changes" : "Add item"}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

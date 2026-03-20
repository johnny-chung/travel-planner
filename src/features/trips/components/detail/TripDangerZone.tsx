"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { archiveTripAction, deleteTripAction } from "@/features/trips/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  tripId: string;
  tripName: string;
  status: "active" | "archived" | "deleted";
};

export default function TripDangerZone({ tripId, tripName, status }: Props) {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border border-red-200 overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
          <span className="text-sm font-semibold">Danger Zone</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-card divide-y divide-border">
            <form action={archiveTripAction}>
              <input type="hidden" name="tripId" value={tripId} />
              <input type="hidden" name="status" value={status === "active" ? "archived" : "active"} />
              <SubmitButton
                type="submit"
                variant="ghost"
                className="w-full h-auto flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left rounded-none justify-start"
              >
                {status === "active" ? (
                  <>
                    <Archive className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Archive trip</p>
                      <p className="text-xs text-muted-foreground">
                        Hides it from the active list. Stops and expenses are locked.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Restore trip</p>
                      <p className="text-xs text-muted-foreground">
                        Move it back to the active list.
                      </p>
                    </div>
                  </>
                )}
              </SubmitButton>
            </form>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-auto flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left rounded-none justify-start"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-600">Delete trip</p>
                <p className="text-xs text-red-400">
                  Permanently deletes all stops and expenses.
                </p>
              </div>
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Trip?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            This will permanently delete <strong>{tripName}</strong> and all its
            stops and expenses. This cannot be undone.
          </p>
          <DialogFooter className="gap-2 flex-row mt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <form action={deleteTripAction} className="flex-1">
              <input type="hidden" name="tripId" value={tripId} />
              <SubmitButton
                variant="destructive"
                className="w-full rounded-xl"
                pendingLabel="Deleting..."
              >
                Delete
              </SubmitButton>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

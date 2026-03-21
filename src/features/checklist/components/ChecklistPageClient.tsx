"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import SubmitButton from "@/features/shared/components/SubmitButton";
import {
  createChecklistItemAction,
  createGuestChecklistItemAction,
  deleteChecklistItemAction,
  deleteGuestChecklistItemAction,
  toggleChecklistItemAction,
  toggleGuestChecklistItemAction,
  updateChecklistItemAction,
  updateGuestChecklistItemAction,
  type ChecklistActionState,
} from "@/features/checklist/actions";
import type { ChecklistItem } from "@/features/checklist/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  tripId: string;
  tripName: string;
  items: ChecklistItem[];
  isArchived: boolean;
  accessMode?: "user" | "guest";
  backHref: string;
  returnTo: string;
};

type ChecklistMutation = (
  state: ChecklistActionState,
  formData: FormData,
) => Promise<ChecklistActionState>;

function InlineAddRow({
  tripId,
  returnTo,
  disabled,
  action,
}: {
  tripId: string;
  returnTo: string;
  disabled: boolean;
  action: ChecklistMutation;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, {});

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-2 rounded-3xl border border-dashed border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted/40",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <Plus className="h-4 w-4" />
        Add checklist item
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-border bg-card px-4 py-3 shadow-sm"
    >
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="flex items-center gap-2">
        <Input
          name="text"
          placeholder="Add a checklist item..."
          autoFocus
          required
        />
        <SubmitButton pendingLabel="Saving...">Save</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {state.error ? (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

function InlineEditRow({
  tripId,
  returnTo,
  item,
  action,
  onCancel,
}: {
  tripId: string;
  returnTo: string;
  item: ChecklistItem;
  action: ChecklistMutation;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="itemId" value={item._id} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Input name="text" defaultValue={item.text} autoFocus required />
      <SubmitButton pendingLabel="Saving...">Save</SubmitButton>
      <button
        type="button"
        onClick={onCancel}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

export default function ChecklistPageClient({
  tripId,
  tripName,
  items,
  isArchived,
  accessMode = "user",
  backHref,
  returnTo,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const createAction =
    accessMode === "guest" ? createGuestChecklistItemAction : createChecklistItemAction;
  const updateAction =
    accessMode === "guest" ? updateGuestChecklistItemAction : updateChecklistItemAction;
  const toggleAction =
    accessMode === "guest" ? toggleGuestChecklistItemAction : toggleChecklistItemAction;
  const deleteAction =
    accessMode === "guest" ? deleteGuestChecklistItemAction : deleteChecklistItemAction;

  const completedCount = items.filter((item) => item.isCompleted).length;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
      <div
        className="relative overflow-hidden px-4 pb-8 text-primary-foreground md:pt-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#1c2421_0%,#2f6e62_58%,#5d7f76_100%)]" />
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href={backHref}
              className="flex items-center gap-1 text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Trip details
            </Link>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/75">
            Checklist
          </p>
          <h1 className="mt-2 text-2xl font-bold">{tripName}</h1>
          <p className="mt-2 text-sm text-primary-foreground/75">
            {completedCount} of {items.length} item{items.length === 1 ? "" : "s"} completed
          </p>
          {isArchived ? (
            <p className="mt-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-primary-foreground/85">
              This trip is archived. Checklist items are view only.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-3 px-4 py-5">
        <InlineAddRow
          tripId={tripId}
          returnTo={returnTo}
          disabled={isArchived}
          action={createAction}
        />

        {items.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card px-5 py-10 text-center shadow-sm">
            <p className="text-base font-semibold text-foreground">No checklist items yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first checklist item for this trip.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="rounded-3xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <form action={toggleAction} className="pt-1">
                  <input type="hidden" name="tripId" value={tripId} />
                  <input type="hidden" name="itemId" value={item._id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <input
                    type="hidden"
                    name="isCompleted"
                    value={item.isCompleted ? "0" : "1"}
                  />
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      disabled={isArchived}
                      onChange={(event) => {
                        event.currentTarget.form?.requestSubmit();
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                </form>

                <div className="min-w-0 flex-1">
                  {editingId === item._id ? (
                    <InlineEditRow
                      tripId={tripId}
                      returnTo={returnTo}
                      item={item}
                      action={updateAction}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <p
                        className={cn(
                          "whitespace-pre-wrap text-sm font-medium text-foreground",
                          item.isCompleted && "text-muted-foreground line-through",
                        )}
                      >
                        {item.text}
                      </p>
                      {item.checkedBy ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Checked by {item.checkedBy}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>

                {editingId !== item._id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isArchived}
                      onClick={() => setEditingId(item._id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <form
                      action={deleteAction}
                      onSubmit={(event) => {
                        if (!window.confirm("Delete this checklist item?")) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="tripId" value={tripId} />
                      <input type="hidden" name="itemId" value={item._id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton
                        type="submit"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground"
                        disabled={isArchived}
                        pendingLabel={<Trash2 className="h-4 w-4" />}
                      >
                        <Trash2 className="h-4 w-4" />
                      </SubmitButton>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

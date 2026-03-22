"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { createExpenseAction, type ExpenseActionState } from "@/features/expense/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClientDictionary } from "@/features/i18n/client";
import { cn } from "@/lib/utils";

const initialState: ExpenseActionState = {};

type Props = {
  tripId: string;
  returnTo: string;
  initialDate: string;
};

export default function ExpenseAddTab({ tripId, returnTo, initialDate }: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const [state, formAction] = useActionState(createExpenseAction, initialState);
  const [expenseType, setExpenseType] = useState<"shared" | "own">("shared");

  return (
    <form action={formAction} className="bg-card rounded-2xl p-5 shadow-sm border border-border space-y-4">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="type" value={expenseType} />

      <div className="space-y-2">
        <Label>{dictionary.expense.expenseType}</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={expenseType === "shared"}
            onClick={() => setExpenseType("shared")}
            className={cn(
              "rounded-xl border-2 px-3 py-2.5 text-center text-sm font-medium transition-colors",
              expenseType === "shared"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {dictionary.expense.shared}
          </button>
          <button
            type="button"
            aria-pressed={expenseType === "own"}
            onClick={() => setExpenseType("own")}
            className={cn(
              "rounded-xl border-2 px-3 py-2.5 text-center text-sm font-medium transition-colors",
              expenseType === "own"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {dictionary.expense.personal}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {expenseType === "shared"
            ? dictionary.expense.sharedHelp
            : dictionary.expense.personalHelp}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{dictionary.expense.description}</Label>
        <Input name="description" placeholder={dictionary.expense.descriptionPlaceholder} className="rounded-xl h-11" required />
      </div>

      <div className="space-y-2">
        <Label>{dictionary.expense.date}</Label>
        <DatePicker
          name="date"
          value={initialDate}
          className="rounded-xl"
          placeholder={dictionary.expense.datePlaceholder}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Label>{dictionary.expense.amount}</Label>
          <Input type="number" name="amount" placeholder="0.00" step="0.01" min="0" className="rounded-xl h-11" required />
        </div>
        <div className="space-y-2">
          <Label>{dictionary.expense.currency}</Label>
          <Input name="currency" value="CAD" readOnly className="rounded-xl h-11 bg-muted text-muted-foreground" />
        </div>
      </div>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}

      <SubmitButton className="w-full h-11 rounded-xl gap-2" pendingLabel={dictionary.expense.adding}>
        <Plus className="w-4 h-4" />
        {dictionary.expense.addExpense}
      </SubmitButton>
      <Button type="reset" variant="ghost" className="hidden" />
    </form>
  );
}

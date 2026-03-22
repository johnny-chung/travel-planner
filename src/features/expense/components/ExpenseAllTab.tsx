"use client";

import { format } from "date-fns";
import { usePathname } from "next/navigation";
import { DollarSign, RefreshCw, Trash2 } from "lucide-react";
import { deleteExpenseAction } from "@/features/expense/actions";
import SubmitButton from "@/features/shared/components/SubmitButton";
import DateRangePicker from "@/components/ui/date-range-picker";
import { Label } from "@/components/ui/label";
import { getClientDictionary } from "@/features/i18n/client";
import type { ExpenseItem, ExpenseMember } from "@/features/expense/types";

type Props = {
  tripId: string;
  currentUserId: string;
  expenses: ExpenseItem[];
  members: ExpenseMember[];
  filterFrom: string;
  filterTo: string;
  returnTo: string;
};

export default function ExpenseAllTab({
  tripId,
  currentUserId,
  expenses,
  members,
  filterFrom,
  filterTo,
  returnTo,
}: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);

  function getMemberName(uid: string) {
    return members.find((member) => member.userId === uid)?.name ?? uid;
  }

  return (
    <div className="space-y-3">
      <form className="flex gap-2 items-end">
        <input type="hidden" name="tab" value="all" />
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">{dictionary.expense.dateRange}</Label>
          <DateRangePicker
            fromName="from"
            toName="to"
            fromValue={filterFrom}
            toValue={filterTo}
            className="w-full"
            placeholder={dictionary.expense.filterPlaceholder}
          />
        </div>
        <SubmitButton variant="ghost" size="icon" className="rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </SubmitButton>
      </form>

      {expenses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{dictionary.expense.noExpenses}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div key={expense._id} className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-base" title={expense.type === "own" ? dictionary.expense.personal : dictionary.expense.shared}>
                {expense.type === "own" ? "👤" : "🤝"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{expense.description}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {format(new Date(expense.date), "MMM d, yyyy")} · {dictionary.expense.by} {getMemberName(expense.addedBy)}
                </p>
              </div>
              <p className="font-bold text-foreground shrink-0">
                {expense.currency} {expense.amount.toFixed(2)}
              </p>
              {expense.addedBy === currentUserId ? (
                <form action={deleteExpenseAction}>
                  <input type="hidden" name="tripId" value={tripId} />
                  <input type="hidden" name="expenseId" value={expense._id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <SubmitButton variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-red-400 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </SubmitButton>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

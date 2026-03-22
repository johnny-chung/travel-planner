"use client";

import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getClientDictionary } from "@/features/i18n/client";
import type { ExpenseItem, ExpenseMember } from "@/features/expense/types";

type Props = {
  expenses: ExpenseItem[];
  members: ExpenseMember[];
  currentUserId: string;
};

export default function ExpenseSummaryTab({
  expenses,
  members,
  currentUserId,
}: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const sharedExpenses = expenses.filter((expense) => expense.type === "shared" && expense.currency === "CAD");
  const myOwnExpenses = expenses.filter((expense) => expense.type === "own" && expense.addedBy === currentUserId && expense.currency === "CAD");
  const totalShared = sharedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalOwn = myOwnExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const splitPerPerson = members.length > 0 ? totalShared / members.length : 0;
  const myTotal = totalOwn + splitPerPerson;

  function getPaidShared(uid: string) {
    return sharedExpenses
      .filter((expense) => expense.addedBy === uid)
      .reduce((sum, expense) => sum + expense.amount, 0);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground mb-1">{dictionary.expense.sharedTotal}</p>
          <p className="text-xl font-bold text-primary">CAD {totalShared.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">÷{members.length} = CAD {splitPerPerson.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground mb-1">{dictionary.expense.myPersonal}</p>
          <p className="text-xl font-bold text-foreground">CAD {totalOwn.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{dictionary.expense.notShared}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <p className="text-xs text-muted-foreground mb-1">{dictionary.expense.myTotalCost}</p>
        <p className="text-2xl font-bold text-foreground">CAD {myTotal.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{dictionary.expense.myTotalHint}</p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border space-y-3">
        <h3 className="font-semibold text-foreground">{dictionary.expense.balancePerPerson}</h3>
        {members.map((member) => {
          const paid = getPaidShared(member.userId);
          const balance = paid - splitPerPerson;
          const isMe = member.userId === currentUserId;

          return (
            <div key={member.userId} className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={member.image} />
                <AvatarFallback className="bg-primary/12 text-primary text-xs font-semibold">
                  {member.name?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{isMe ? dictionary.expense.you : member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isMe
                    ? `${dictionary.expense.spending}: CAD ${paid.toFixed(2)}`
                    : `${dictionary.expense.paid}: CAD ${paid.toFixed(2)}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                {balance > 0.005 ? (
                  <p className="text-sm font-semibold text-green-600">
                    {isMe ? "+" : `${dictionary.expense.youOwe} `}CAD {balance.toFixed(2)}
                  </p>
                ) : balance < -0.005 ? (
                  <p className="text-sm font-semibold text-red-500">
                    {isMe ? "-" : `${dictionary.expense.owesYou} `}CAD {Math.abs(balance).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-muted-foreground">{dictionary.expense.settled}</p>
                )}
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground/60 pt-1">{dictionary.expense.equalSplitNote}</p>
      </div>
    </div>
  );
}

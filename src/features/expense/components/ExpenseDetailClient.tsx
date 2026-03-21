"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import ExpenseAddTab from "@/features/expense/components/ExpenseAddTab";
import ExpenseAllTab from "@/features/expense/components/ExpenseAllTab";
import ExpenseSummaryTab from "@/features/expense/components/ExpenseSummaryTab";
import ExpenseTabsNav from "@/features/expense/components/ExpenseTabsNav";
import type { ExpenseItem, ExpenseMember, ExpenseTab } from "@/features/expense/types";

type Props = {
  tripId: string;
  tripName: string;
  currentUserId: string;
  members: ExpenseMember[];
  expenses: ExpenseItem[];
  currentTab: ExpenseTab;
  filterFrom: string;
  filterTo: string;
  currentDate: string;
};

function buildReturnTo(tripId: string, tab: ExpenseTab, from: string, to: string) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return `/trips/${tripId}/expense?${params.toString()}`;
}

export default function ExpenseDetailClient({
  tripId,
  tripName,
  currentUserId,
  members,
  expenses,
  currentTab,
  filterFrom,
  filterTo,
  currentDate,
}: Props) {
  return (
    <div className="h-screen flex flex-col bg-background pb-16 md:pb-0 md:pt-16 overflow-hidden">
      <div
        className="bg-[linear-gradient(180deg,rgba(52,92,89,0.98)_0%,rgba(39,72,70,0.96)_100%)] px-4 pb-4 text-primary-foreground md:pb-6 shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="max-w-2xl mx-auto">
          <Link href="/expense" className="mb-3 flex items-center gap-1 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4" /> All Expenses
          </Link>
          <h1 className="text-xl font-bold">{tripName}</h1>
          <p className="mt-0.5 text-sm text-primary-foreground/70">Expense Tracker</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-2xl mx-auto w-full">
        <Tabs value={currentTab} className="h-full flex flex-col">
          <ExpenseTabsNav tripId={tripId} from={filterFrom} to={filterTo} />

          {currentTab === "add" ? (
            <TabsContent value="add" className="flex-1 overflow-y-auto px-4 py-4">
              <ExpenseAddTab
                tripId={tripId}
                returnTo={buildReturnTo(tripId, "add", filterFrom, filterTo)}
                initialDate={currentDate}
              />
            </TabsContent>
          ) : null}

          {currentTab === "all" ? (
            <TabsContent value="all" className="flex-1 overflow-y-auto px-4 py-3">
              <ExpenseAllTab
                tripId={tripId}
                currentUserId={currentUserId}
                expenses={expenses}
                members={members}
                filterFrom={filterFrom}
                filterTo={filterTo}
                returnTo={buildReturnTo(tripId, "all", filterFrom, filterTo)}
              />
            </TabsContent>
          ) : null}

          {currentTab === "summary" ? (
            <TabsContent value="summary" className="flex-1 overflow-y-auto px-4 py-4">
              <ExpenseSummaryTab
                expenses={expenses}
                members={members}
                currentUserId={currentUserId}
              />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </div>
  );
}

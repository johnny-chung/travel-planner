"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientDictionary, getClientLocale } from "@/features/i18n/client";
import { localizeHref } from "@/features/i18n/config";
import type { ExpenseTab } from "@/features/expense/types";

type Props = {
  tripId: string;
  from: string;
  to: string;
};

export default function ExpenseTabsNav({
  tripId,
  from,
  to,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getClientLocale(pathname);
  const dictionary = getClientDictionary(pathname);

  function pushTab(nextTab: ExpenseTab) {
    const params = new URLSearchParams();
    params.set("tab", nextTab);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(localizeHref(locale, `/trips/${tripId}/expense?${params.toString()}`));
  }

  return (
    <TabsList className="mx-auto mt-3 w-[280px] grid grid-cols-3 rounded-2xl bg-muted shrink-0">
      <TabsTrigger value="add" onClick={() => pushTab("add")} className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground">
        {dictionary.expense.tabAdd}
      </TabsTrigger>
      <TabsTrigger value="all" onClick={() => pushTab("all")} className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground">
        {dictionary.expense.tabAll}
      </TabsTrigger>
      <TabsTrigger value="summary" onClick={() => pushTab("summary")} className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground">
        {dictionary.expense.tabSummary}
      </TabsTrigger>
    </TabsList>
  );
}

import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import ExpenseDetailClient from "@/features/expense/components/ExpenseDetailClient";
import { localizeHref, type AppLocale } from "@/features/i18n/config";
import {
  getExpensePageDataForUser,
  ExpenseServiceError,
} from "@/features/expense/service";
import type { ExpenseTab } from "@/features/expense/types";

type Props = {
  params: Promise<{ lang: AppLocale; tripId: string }>;
  searchParams: Promise<{
    tab?: string;
    from?: string;
    to?: string;
  }>;
};

function parseTab(tab: string | undefined): ExpenseTab {
  if (tab === "all" || tab === "summary") {
    return tab;
  }
  return "add";
}

export default async function TripExpensePage({ params, searchParams }: Props) {
  const [{ lang, tripId }, session, query] = await Promise.all([
    params,
    auth(),
    searchParams,
  ]);
  if (!session?.user?.id) redirect(localizeHref(lang, "/login"));

  let pageData;
  try {
    // Keep expense reads in the server page so the client only handles interaction.
    pageData = await getExpensePageDataForUser({
      tripId,
      userId: session.user.id,
      from: query.from,
      to: query.to,
    });
  } catch (error) {
    if (
      error instanceof ExpenseServiceError &&
      error.code === "NOT_FOUND"
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <ExpenseDetailClient
      tripId={pageData.tripId}
      tripName={pageData.tripName}
      currentUserId={session.user.id}
      members={pageData.members}
      expenses={pageData.expenses}
      currentTab={parseTab(query.tab)}
      filterFrom={query.from ?? ""}
      filterTo={query.to ?? ""}
      currentDate={new Date().toISOString().slice(0, 10)}
    />
  );
}

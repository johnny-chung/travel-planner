"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import TripCardGrid from "@/components/trips/list/TripCardGrid";
import TripCreateDialog from "@/components/trips/list/TripCreateDialog";
import { Button } from "@/components/ui/button";
import type { TripSummary } from "@/types/travel";

export type Trip = TripSummary;

type Props = {
  initialTrips: TripSummary[];
  googleMapsApiKey: string;
  pageTitle: string;
  showCreate?: boolean;
  currentView: "active" | "all";
  activeTripCount: number;
  showFilters?: boolean;
  collectionPath?: "/trips" | "/plans" | "/expense";
  cardTarget?: "trip" | "plan" | "expense";
};

export default function TripListClient({
  initialTrips,
  googleMapsApiKey,
  pageTitle,
  showCreate = true,
  currentView,
  activeTripCount,
  showFilters = true,
  collectionPath = "/trips",
  cardTarget = "trip",
}: Props) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 md:pt-16">
      <div className="px-4 pt-6 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeTripCount} trip{activeTripCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => startTransition(() => router.refresh())}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            {showCreate ? (
              <Button
                type="button"
                className="h-10 rounded-xl gap-2 font-semibold hidden md:flex"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="w-4 h-4" /> New Trip
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto w-full pb-4 space-y-4">
        {showFilters ? (
          <div className="flex items-center gap-2">
            <Link
              href={
                currentView === "active"
                  ? collectionPath
                  : `${collectionPath}?view=active`
              }
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                currentView === "active"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Active
            </Link>
            <Link
              href={`${collectionPath}?view=all`}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                currentView === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              All
            </Link>
          </div>
        ) : null}

        <TripCardGrid trips={initialTrips} cardTarget={cardTarget} />
      </div>

      {showCreate ? (
        <div className="md:hidden fixed bottom-20 right-4 z-40">
          <Button
            type="button"
            className="w-14 h-14 rounded-2xl shadow-xl p-0"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      ) : null}

      {showCreate ? (
        <TripCreateDialog
          apiKey={googleMapsApiKey}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      ) : null}
    </div>
  );
}

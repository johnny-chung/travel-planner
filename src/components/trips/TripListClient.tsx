"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  collectionPath?: "/trips" | "/plans" | "/expense" | "/try";
  cardTarget?: "trip" | "plan" | "expense" | "trial";
  createMode?: "user" | "guest";
  canShareCode?: boolean;
  allowJoin?: boolean;
  createDialogTitle?: string;
  autoOpenCreate?: boolean;
  decorationImage?: string;
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
  createMode = "user",
  canShareCode = true,
  allowJoin = true,
  createDialogTitle = "New Trip",
  autoOpenCreate = false,
  decorationImage = "/material/Compass.png",
}: Props) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [showCreateDialog, setShowCreateDialog] = useState(autoOpenCreate);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5ead8] pb-16 md:pb-0 md:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,154,88,0.14),_transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(123,76,43,0.18),rgba(123,76,43,0))]" />

      <div className="relative px-4 pt-6 pb-4 max-w-4xl mx-auto w-full">
        <div className="rounded-[2rem] border border-[#d7b48f]/60 bg-[linear-gradient(135deg,#6d4323_0%,#8b562d_55%,#a86835_100%)] px-5 py-5 shadow-[0_24px_70px_rgba(86,58,35,0.16)] sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#fff6ec]">
                {pageTitle}
              </h1>
              <p className="mt-1 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[#f3debf]">
                {activeTripCount} trip{activeTripCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-2xl border-[#d8b188]/45 bg-[#fff7ea]/10 text-[#fff1db] hover:bg-[#fff7ea]/20 hover:text-[#fff7ea]"
                onClick={() => startTransition(() => router.refresh())}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              {showCreate ? (
                <Button
                  type="button"
                  className="hidden h-11 rounded-2xl border border-[#d8b188]/45 bg-[#fff7ea] px-5 font-semibold text-[#734626] shadow-sm hover:bg-[#f8ead5] md:flex"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> New Trip
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-4 max-w-4xl mx-auto w-full pb-8 space-y-5">
        {showFilters ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d7b48f]/60 bg-[#fff7ea]/90 p-1 shadow-[0_12px_30px_rgba(86,58,35,0.08)]">
            <Link
              href={
                currentView === "active"
                  ? collectionPath
                  : `${collectionPath}?view=active`
              }
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                currentView === "active"
                  ? "bg-[#9a6036] text-[#fff6ec]"
                  : "text-[#7a5a40] hover:bg-[#f1dfc5]"
              }`}
            >
              Active
            </Link>
            <Link
              href={`${collectionPath}?view=all`}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                currentView === "all"
                  ? "bg-[#9a6036] text-[#fff6ec]"
                  : "text-[#7a5a40] hover:bg-[#f1dfc5]"
              }`}
            >
              All
            </Link>
          </div>
        ) : null}

        <TripCardGrid trips={initialTrips} cardTarget={cardTarget} canShareCode={canShareCode} />
      </div>

      <div className="pointer-events-none fixed bottom-6 right-5 z-0 hidden md:block">
        <div className="relative h-40 w-40 opacity-75">
          <Image
            src={decorationImage}
            alt=""
            fill
            className="object-contain drop-shadow-[0_18px_30px_rgba(86,58,35,0.12)]"
            sizes="160px"
          />
        </div>
      </div>

      {showCreate ? (
        <div className="md:hidden fixed bottom-20 right-4 z-40">
          <Button
            type="button"
            className="h-14 w-14 rounded-[1.4rem] border border-[#d7b48f]/60 bg-[#9a6036] p-0 text-[#fff6ec] shadow-[0_20px_50px_rgba(86,58,35,0.2)] hover:bg-[#8a542f]"
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
          mode={createMode}
          allowJoin={allowJoin}
          title={createDialogTitle}
        />
      ) : null}
    </div>
  );
}

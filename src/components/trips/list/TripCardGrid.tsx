"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronRight, ChevronUp, Map, MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ShareCodeDialog from "@/components/shared/ShareCodeDialog";
import type { TripSummary } from "@/types/travel";

type Props = {
  trips: TripSummary[];
  cardTarget?: "trip" | "plan" | "expense";
};

function getTripHref(tripId: string, cardTarget: "trip" | "plan" | "expense") {
  if (cardTarget === "plan") {
    return `/trips/${tripId}/plan`;
  }

  if (cardTarget === "expense") {
    return `/trips/${tripId}/expense`;
  }

  return `/trips/${tripId}`;
}

function getTravelDateRangeLabel(travelDates: string[]) {
  if (travelDates.length === 0) {
    return "";
  }

  const start = new Date(travelDates[0]);
  const end = new Date(travelDates[travelDates.length - 1]);

  if (travelDates.length === 1 || travelDates[0] === travelDates[travelDates.length - 1]) {
    return format(start, "MMM d, yyyy");
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  }

  if (sameYear) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }

  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
}

export default function TripCardGrid({ trips, cardTarget = "trip" }: Props) {
  const [shareTrip, setShareTrip] = useState<TripSummary | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const activeTrips = trips.filter((trip) => trip.status !== "archived");
  const archivedTrips = trips.filter((trip) => trip.status === "archived");

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
          <Map className="w-10 h-10 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="font-semibold text-foreground text-lg">No trips yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Create your first trip to get started
        </p>
      </div>
    );
  }

  function TripCard({ trip }: { trip: TripSummary }) {
    const isPending = trip.role === "pending";
    const canShare = trip.role !== "pending" && trip.status !== "archived";
    const travelDateLabel = getTravelDateRangeLabel(trip.travelDates);

    return (
      <Link
        href={isPending ? "#" : getTripHref(trip._id, cardTarget)}
        className={`bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3 transition-all ${
          isPending
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer active:scale-[0.98] hover:shadow-md"
        }`}
        onClick={(event) => {
          if (isPending) {
            event.preventDefault();
          }
        }}
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <Map className="w-6 h-6 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-foreground truncate max-w-[140px]">
              {trip.name}
            </h3>
            {trip.role === "editor" ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                Editor
              </Badge>
            ) : null}
            {trip.role === "pending" ? (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 text-yellow-600 border-yellow-300"
              >
                Pending
              </Badge>
            ) : null}
            {trip.status === "archived" ? (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                Archived
              </Badge>
            ) : null}
          </div>
          {trip.centerName ? (
            <p className="text-muted-foreground text-sm truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {trip.centerName}
            </p>
          ) : trip.description ? (
            <p className="text-muted-foreground text-sm truncate mt-0.5">
              {trip.description}
            </p>
          ) : null}
          {travelDateLabel ? (
            <p className="text-muted-foreground/60 text-xs mt-0.5">
              {travelDateLabel}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canShare ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/60 hover:text-blue-500"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShareTrip(trip);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          ) : null}
          {!isPending ? <ChevronRight className="w-4 h-4 text-muted-foreground/60" /> : null}
        </div>
      </Link>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {activeTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTrips.map((trip) => (
              <TripCard key={trip._id} trip={trip} />
            ))}
          </div>
        ) : null}

        {archivedTrips.length > 0 ? (
          <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
              {archivedOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Archived Trips ({archivedTrips.length})
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {archivedTrips.map((trip) => (
                  <TripCard key={trip._id} trip={trip} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>

      {shareTrip ? (
        <ShareCodeDialog
          open={!!shareTrip}
          onOpenChange={(open) => {
            if (!open) {
              setShareTrip(null);
            }
          }}
          title="Share Trip"
          description={`Share this code so others can request to join ${shareTrip.name}.`}
          shareCode={shareTrip.shareCode}
        />
      ) : null}
    </>
  );
}

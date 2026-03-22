"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronRight, ChevronUp, Map, MapPin, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ShareCodeDialog from "@/features/shared/components/ShareCodeDialog";
import { getClientDictionary, getClientLocale } from "@/features/i18n/client";
import { localizeHref } from "@/features/i18n/config";
import type { TripSummary } from "@/types/travel";

type Props = {
  trips: TripSummary[];
  cardTarget?: "trip" | "plan" | "expense" | "trial";
  canShareCode?: boolean;
};

function getTripHref(tripId: string, cardTarget: "trip" | "plan" | "expense" | "trial") {
  if (cardTarget === "trial") {
    return `/try/${tripId}`;
  }

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

export default function TripCardGrid({
  trips,
  cardTarget = "trip",
  canShareCode = true,
}: Props) {
  const pathname = usePathname();
  const locale = getClientLocale(pathname);
  const dictionary = getClientDictionary(pathname);
  const [shareTrip, setShareTrip] = useState<TripSummary | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const activeTrips = trips.filter((trip) => trip.status !== "archived");
  const archivedTrips = trips.filter((trip) => trip.status === "archived");

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-primary/12">
          <Map className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{dictionary.home.emptyTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {dictionary.home.emptyBodyPrefix} {dictionary.home.emptyBodyLink} {dictionary.home.emptyBodySuffix}
        </p>
      </div>
    );
  }

  function TripCard({ trip }: { trip: TripSummary }) {
    const isPending = trip.role === "pending";
    const canShare =
      canShareCode && trip.role !== "pending" && trip.status !== "archived";
    const travelDateLabel = getTravelDateRangeLabel(trip.travelDates);

    return (
      <Link
        href={isPending ? "#" : localizeHref(locale, getTripHref(trip._id, cardTarget))}
        className={`flex items-center gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-[0_18px_45px_rgba(47,67,65,0.08)] transition-all dark:shadow-[0_18px_45px_rgba(0,0,0,0.22)] ${
          isPending
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer active:scale-[0.98] hover:shadow-[0_22px_55px_rgba(47,67,65,0.12)] dark:hover:shadow-[0_22px_55px_rgba(0,0,0,0.28)]"
        }`}
        onClick={(event) => {
          if (isPending) {
            event.preventDefault();
          }
        }}
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {trip.centerThumbnail ? (
            <Image
              src={trip.centerThumbnail}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="60px"
            />
          ) : (
            <Map className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="max-w-[140px] truncate font-semibold text-foreground">
              {trip.name}
            </h3>
            {trip.role === "editor" ? (
              <Badge
                variant="secondary"
                className="h-4 bg-primary/12 px-1.5 py-0 text-[10px] text-primary hover:bg-primary/12"
              >
                {dictionary.tripList.editor}
              </Badge>
            ) : null}
            {trip.role === "pending" ? (
              <Badge
                variant="outline"
                className="h-4 border-accent px-1.5 py-0 text-[10px] text-accent-foreground"
              >
                {dictionary.tripList.pending}
              </Badge>
            ) : null}
            {trip.status === "archived" ? (
              <Badge className="h-4 bg-muted px-1.5 py-0 text-[10px] text-muted-foreground hover:bg-muted">
                {dictionary.tripList.archived}
              </Badge>
            ) : null}
          </div>
          {trip.centerName ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {trip.centerName}
            </p>
          ) : trip.description ? (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {trip.description}
            </p>
          ) : null}
          {travelDateLabel ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
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
              className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShareTrip(trip);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          ) : null}
          {!isPending ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : null}
        </div>
      </Link>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {activeTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTrips.map((trip) => (
              <TripCard key={trip._id} trip={trip} />
            ))}
          </div>
        ) : null}

        {archivedTrips.length > 0 ? (
          <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {archivedOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {dictionary.tripList.archivedTrips} ({archivedTrips.length})
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
          title={dictionary.tripDetail.shareTitle}
          description={dictionary.tripDetail.shareDescription.replace("{tripName}", shareTrip.name)}
          shareCode={shareTrip.shareCode}
        />
      ) : null}
    </>
  );
}

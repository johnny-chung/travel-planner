"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronRight, ChevronUp, Map, MapPin, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ShareCodeDialog from "@/features/shared/components/ShareCodeDialog";
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
  const [shareTrip, setShareTrip] = useState<TripSummary | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const activeTrips = trips.filter((trip) => trip.status !== "archived");
  const archivedTrips = trips.filter((trip) => trip.status === "archived");

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-[#f1dfc5]">
          <Map className="h-10 w-10 text-[#a56639]" />
        </div>
        <h3 className="text-lg font-semibold text-[#4a3223]">No trips yet</h3>
        <p className="mt-1 text-sm text-[#6f5138]">
          Create your first trip to get started
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
        href={isPending ? "#" : getTripHref(trip._id, cardTarget)}
        className={`flex items-center gap-3 rounded-[1.7rem] border border-[#d9b58c]/60 bg-[#fff9f0] p-4 shadow-[0_18px_45px_rgba(86,58,35,0.08)] transition-all ${
          isPending
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer active:scale-[0.98] hover:shadow-[0_22px_55px_rgba(86,58,35,0.12)]"
        }`}
        onClick={(event) => {
          if (isPending) {
            event.preventDefault();
          }
        }}
      >
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] bg-[#f1dfc5]">
          {trip.centerThumbnail ? (
            <Image
              src={trip.centerThumbnail}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <Map className="h-6 w-6 text-[#a56639]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="max-w-[140px] truncate font-semibold text-[#4a3223]">
              {trip.name}
            </h3>
            {trip.role === "editor" ? (
              <Badge
                variant="secondary"
                className="h-4 bg-[#f1dfc5] px-1.5 py-0 text-[10px] text-[#7b4c2b] hover:bg-[#f1dfc5]"
              >
                Editor
              </Badge>
            ) : null}
            {trip.role === "pending" ? (
              <Badge
                variant="outline"
                className="h-4 border-[#d3ad66] px-1.5 py-0 text-[10px] text-[#9a6a1f]"
              >
                Pending
              </Badge>
            ) : null}
            {trip.status === "archived" ? (
              <Badge className="h-4 bg-[#efe1cb] px-1.5 py-0 text-[10px] text-[#8a633f] hover:bg-[#efe1cb]">
                Archived
              </Badge>
            ) : null}
          </div>
          {trip.centerName ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-[#6f5138]">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {trip.centerName}
            </p>
          ) : trip.description ? (
            <p className="mt-0.5 truncate text-sm text-[#6f5138]">
              {trip.description}
            </p>
          ) : null}
          {travelDateLabel ? (
            <p className="mt-0.5 text-xs text-[#8b6a50]">
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
              className="h-8 w-8 rounded-xl text-[#8b6a50] hover:bg-[#f1dfc5] hover:text-[#9a6036]"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShareTrip(trip);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          ) : null}
          {!isPending ? <ChevronRight className="w-4 h-4 text-[#a07d60]" /> : null}
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
            <CollapsibleTrigger className="flex items-center gap-2 py-1 text-sm font-medium text-[#7a5a40] transition-colors hover:text-[#4a3223]">
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

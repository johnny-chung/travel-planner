"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getClientDictionary } from "@/features/i18n/client";
import type { TripStayItem } from "@/types/trip-logistics";

type Props = {
  stay: TripStayItem;
};

export default function StayDetailModal({ stay }: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.address)}&query_place_id=${stay.placeId}`;

  return (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      <div className="flex-shrink-0 px-6 pb-2 pt-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-accent/70 p-2.5 text-accent-foreground">
            <BedDouble className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-foreground">
              {stay.name}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {stay.checkInDate} {dictionary.planner.dateRangeConnector}{" "}
              {stay.checkOutDate}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
        {stay.thumbnail ? (
          <div className="h-44 overflow-hidden rounded-xl bg-muted">
            <Image
              src={stay.thumbnail}
              alt={stay.name}
              width={640}
              height={352}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
            {dictionary.planner.contact}
          </div>
          <div className="divide-y divide-border/60">
            <div className="flex items-start gap-3 px-4 py-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-foreground">{stay.address}</span>
            </div>
            {stay.phone ? (
              <a
                href={`tel:${stay.phone}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
              >
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {stay.phone}
                </span>
              </a>
            ) : null}
            {stay.website ? (
              <a
                href={stay.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
              >
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium text-primary">
                  {stay.website.replace(/^https?:\/\//, "")}
                </span>
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border px-6 pb-8 pt-3">
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
            <ExternalLink className="mr-2 h-4 w-4" />
            {dictionary.planner.openInGoogleMaps}
          </Button>
        </a>
      </div>
    </div>
  );
}

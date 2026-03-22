"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, Car, ChevronRight, Footprints } from "lucide-react";
import { getClientDictionary } from "@/features/i18n/client";
import type { TravelTimeEntry } from "@/features/planner/components/plan-map/types";

type Props = {
  travelTime: TravelTimeEntry | null;
  href: string;
};

const ModeIcon = { TRANSIT: Bus, DRIVE: Car, WALK: Footprints } as const;

function formatDistance(distanceMeters?: number | null) {
  if (!distanceMeters || distanceMeters <= 0) return "";
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(distanceMeters >= 10000 ? 0 : 1)} km`;
}

export default function TravelTimeCard({ travelTime, href }: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  if (!travelTime) return null;
  const Icon = ModeIcon[travelTime.mode];
  const fallbackSummary =
    travelTime.mode === "TRANSIT"
      ? `${travelTime.durationMinutes} min`
      : [formatDistance(travelTime.distanceMeters), `${travelTime.durationMinutes} min`]
          .filter(Boolean)
          .join(" • ");
  const summary = travelTime.summary || fallbackSummary;

  return (
    <div className="py-0 px-4 my-1">
      <Link
        href={href}
        className="block w-full rounded-xl bg-muted/50 hover:bg-muted text-left transition-colors px-3 py-2"
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5 rounded-full bg-background/80 p-1.5 text-muted-foreground">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground/80 truncate">
              {summary}
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              {dictionary.planner.travelTotal.replace(
                "{minutes}",
                String(travelTime.durationMinutes),
              )}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/70 flex-shrink-0 mt-1" />
        </div>
      </Link>
    </div>
  );
}

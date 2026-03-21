import { format } from "date-fns";
import { BedDouble, Bus, Car, Clock, Footprints, MapPin, Plane } from "lucide-react";

import type { PlannerTimelineItem, TravelTimeEntry } from "@/features/planner/components/plan-map/types";
import { buildRouteSegments } from "@/features/planner/timeline";

type Props = {
  planName: string;
  description?: string;
  timelineItems: PlannerTimelineItem[];
  unscheduledStops?: PlannerTimelineItem[];
  travelTimes?: TravelTimeEntry[];
  from?: string;
  to?: string;
};

function formatDayLabel(date: string) {
  try {
    return format(new Date(`${date}T00:00:00`), "EEE, MMM d, yyyy");
  } catch {
    return date;
  }
}

function buildGoogleMapsLink(address: string, lat: number, lng: number) {
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://maps.google.com/?q=${lat},${lng}`;
  }

  return address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : "";
}

export default function PlannerPrintView({
  planName,
  description = "",
  timelineItems,
  unscheduledStops = [],
  travelTimes = [],
  from = "",
  to = "",
}: Props) {
  const grouped = new Map<string, PlannerTimelineItem[]>();
  for (const item of timelineItems) {
    const items = grouped.get(item.date) ?? [];
    items.push(item);
    grouped.set(item.date, items);
  }

  const modeIcon = {
    TRANSIT: Bus,
    DRIVE: Car,
    WALK: Footprints,
  } as const;

  return (
    <main className="mx-auto max-w-sm px-4 py-5 sm:px-6 print:max-w-none print:px-0 print:py-0">
      <style>{`
        @page {
          size: A5 portrait;
          margin: 12mm;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          html, body {
            background: white !important;
          }
        }
      `}</style>

      <div className="space-y-5">
        <section className="rounded-[28px] border bg-card px-5 py-5 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Itinerary Snapshot
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{planName}</h1>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
          {from || to ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {from || "start"} to {to || "end"}
            </p>
          ) : null}
        </section>

        {timelineItems.length === 0 ? (
          <section className="rounded-[28px] border bg-card px-5 py-6 text-center shadow-sm print:rounded-none print:border-0 print:px-0 print:py-4 print:shadow-none">
            <p className="text-sm text-muted-foreground">No scheduled items yet.</p>
          </section>
        ) : null}

        {[...grouped.entries()].map(([date, items]) => {
          const routeSegments = buildRouteSegments(items);
          const segmentByFromId = new Map(routeSegments.map((segment) => [segment.from.id, segment]));
          return (
          <section
            key={date}
            className="rounded-[28px] border bg-card px-3 py-3 shadow-sm print:break-inside-avoid print:rounded-none print:border-0 print:px-0 print:py-0 print:shadow-none"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                {formatDayLabel(date)}
              </h2>
            </div>
            <div className="space-y-2.5">
              {items.map((item) => {
                if (item.kind === "stop") {
                  const stop = item.stop;
                  const mapLink = buildGoogleMapsLink(stop.address, stop.lat, stop.lng);
                  const segment = segmentByFromId.get(item.id) ?? null;
                  const travelTime =
                    segment
                      ? travelTimes.find(
                          (travel) =>
                            travel.fromStopId === segment.from.id &&
                            travel.toStopId === segment.to.id,
                        ) ?? null
                      : null;
                  return (
                    <article key={item.id} className="rounded-2xl border px-3 py-2.5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
                          {stop.order}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {stop.name}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{stop.displayTime ? stop.time : "No time set"}</span>
                          </div>
                          {stop.address ? (
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {stop.address}
                            </p>
                          ) : null}
                          {mapLink ? (
                            <a
                              href={mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2"
                            >
                              <MapPin className="h-3 w-3" />
                              Open in Google Maps
                            </a>
                          ) : null}
                          {travelTime ? (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                              {(() => {
                                const Icon = modeIcon[travelTime.mode];
                                return <Icon className="h-3 w-3" />;
                              })()}
                              <span>
                                {travelTime.summary ||
                                  `${travelTime.durationMinutes} min`}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                }

                if (item.kind === "stay") {
                  const stay = item.stay;
                  const mapLink = buildGoogleMapsLink(stay.address, stay.lat, stay.lng);
                  return (
                            <article key={item.id} className="rounded-2xl border border-border bg-accent/25 px-3 py-2.5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-xl bg-accent/70 p-2 text-accent-foreground">
                          <BedDouble className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{stay.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {stay.checkInDate} to {stay.checkOutDate}
                          </p>
                          {mapLink ? (
                            <a
                              href={mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2"
                            >
                              <MapPin className="h-3 w-3" />
                              Open in Google Maps
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                }

                const transport = item.transport;
                const location =
                  item.boundary === "arrival"
                    ? transport.arrival.name || transport.arrival.address
                    : transport.departure.name || transport.departure.address;
                return (
                    <article key={item.id} className="rounded-2xl border border-border bg-muted/40 px-3 py-2.5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-xl bg-primary/12 p-2 text-primary">
                        <Plane className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{transport.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.time} {item.boundary === "arrival" ? "Arrive" : "Depart"}
                        </p>
                        {location ? (
                          <p className="mt-1 text-xs text-muted-foreground">{location}</p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )})}

        {unscheduledStops.length > 0 ? (
          <section className="rounded-[28px] border bg-card px-3 py-3 shadow-sm print:break-inside-avoid print:rounded-none print:border-0 print:px-0 print:py-0 print:shadow-none">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                Unscheduled Stops
              </h2>
            </div>
            <div className="space-y-2.5">
              {unscheduledStops.map((item) => {
                if (item.kind !== "stop") return null;
                const stop = item.stop;
                const mapLink = buildGoogleMapsLink(stop.address, stop.lat, stop.lng);
                return (
                  <article key={item.id} className="rounded-2xl border px-3 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{stop.name}</p>
                    {stop.address ? (
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{stop.address}</p>
                    ) : null}
                    {mapLink ? (
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2"
                      >
                        <MapPin className="h-3 w-3" />
                        Open in Google Maps
                      </a>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

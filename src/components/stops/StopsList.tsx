import Link from "next/link";
import { MapPin, Clock, Calendar, ChevronDown, ChevronRight, Plane, BedDouble } from "lucide-react";
import { format } from "date-fns";
import type {
  PlannerTimelineItem,
  TravelTimeEntry,
} from "@/components/map/plan-map/types";
import TravelTimeCard from "@/components/stops/TravelTimeCard";
import {
  buildPlannerHref,
  type PlannerSearchState,
} from "@/features/planner/search-params";
import { buildRouteSegments } from "@/features/planner/timeline";

type Props = {
  pathname: string;
  searchState: PlannerSearchState;
  timelineItems: PlannerTimelineItem[];
  travelTimes?: TravelTimeEntry[];
};

function computeLeaveBy(arrivalTime: string, durationMinutes: number): string {
  const [hStr, mStr] = arrivalTime.split(":");
  const totalMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) - durationMinutes;
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function StopsList({
  pathname,
  searchState,
  timelineItems,
  travelTimes = [],
}: Props) {
  if (timelineItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-primary/60" />
        </div>
        <h3 className="font-semibold text-foreground text-lg">No stops yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Use the Add stop button to search for your first place.
        </p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, PlannerTimelineItem[]> = {};
  timelineItems.forEach((item) => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-5 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
      {Object.entries(grouped).map(([date, dayItems]) => {
        const formattedDate = (() => {
          try { return format(new Date(date + "T00:00:00"), "EEE, MMM d, yyyy"); }
          catch { return date; }
        })();

        return (
          <details key={date} open className="group rounded-2xl bg-muted/20 px-3 py-2">
            <summary className="mb-2 flex cursor-pointer list-none items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide truncate">{formattedDate}</span>
                <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {dayItems.length}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-0">
              {(() => {
                const routeSegments = buildRouteSegments(dayItems);
                const segmentByFromId = new Map(
                  routeSegments.map((segment) => [segment.from.id, segment]),
                );

                return dayItems.map((item) => {
                  if (item.kind === "stop") {
                    const stop = item.stop;
                    const segment = segmentByFromId.get(item.id) ?? null;
                    const travelTime = segment
                      ? travelTimes.find(
                          (travel) =>
                            travel.fromStopId === segment.from.id &&
                            travel.toStopId === segment.to.id,
                        ) ?? null
                      : null;
                    const leaveByTime =
                      travelTime && segment?.to.displayTime
                        ? computeLeaveBy(segment.to.time, travelTime.durationMinutes)
                        : null;

                    return (
                      <div key={item.id} className="my-1">
                        <Link
                          href={buildPlannerHref(pathname, searchState, {
                            stopId: stop._id,
                            arrivalIndex: stop._arrivalIndex ?? 0,
                            edit: false,
                            travelFrom: null,
                            travelTo: null,
                          })}
                          className="block w-full bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3 text-left active:scale-[0.98] transition-transform hover:shadow-md"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white text-[9px] font-bold">{stop.order}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{stop.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {stop.displayTime ? stop.time : "Stay"}
                              </span>
                              {stop.address && (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <MapPin className="w-3 h-3 text-muted-foreground/60" />
                                  <span className="text-xs text-muted-foreground truncate">{stop.address.split(",")[0]}</span>
                                </>
                              )}
                            </div>
                            {leaveByTime ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-orange-400" />
                                <span className="text-xs text-orange-500 font-medium">Leave by {leaveByTime}</span>
                              </div>
                            ) : null}
                            {stop.notes && (
                              <p className="text-xs text-muted-foreground truncate mt-1">{stop.notes}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                        </Link>
                        {segment ? (
                          <TravelTimeCard
                            travelTime={travelTime}
                            href={buildPlannerHref(pathname, searchState, {
                              stopId: null,
                              arrivalIndex: 0,
                              edit: false,
                              travelFrom: segment.from.id,
                              travelTo: segment.to.id,
                            })}
                          />
                        ) : null}
                      </div>
                    );
                  }

                  if (item.kind === "transport") {
                    const transport = item.transport;
                    const segment = segmentByFromId.get(item.id) ?? null;
                    const travelTime = segment
                      ? travelTimes.find(
                          (travel) =>
                            travel.fromStopId === segment.from.id &&
                            travel.toStopId === segment.to.id,
                        ) ?? null
                      : null;
                    return (
                      <div key={item.id}>
                        <div className="my-0 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-0">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                              <Plane className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {transport.title}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {transport.departureTime} → {transport.arrivalDate === transport.departureDate ? "" : `${transport.arrivalDate} `}
                                {transport.arrivalTime}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground truncate">
                                {transport.departure.name || transport.departure.address.split(",")[0]} → {transport.arrival.name || transport.arrival.address.split(",")[0]}
                              </p>
                            </div>
                          </div>
                        </div>
                        {segment ? (
                          <TravelTimeCard
                            travelTime={travelTime}
                            href={buildPlannerHref(pathname, searchState, {
                              stopId: null,
                              arrivalIndex: 0,
                              edit: false,
                              travelFrom: segment.from.id,
                              travelTo: segment.to.id,
                            })}
                          />
                        ) : null}
                      </div>
                    );
                  }

                  const stay = item.stay;
                  const segment = segmentByFromId.get(item.id) ?? null;
                  const travelTime = segment
                    ? travelTimes.find(
                        (travel) =>
                          travel.fromStopId === segment.from.id &&
                          travel.toStopId === segment.to.id,
                      ) ?? null
                    : null;

                  return (
                    <div key={item.id}>
                      <Link
                        href={buildPlannerHref(pathname, searchState, {
                          stayId: stay._id,
                          stopId: null,
                          arrivalIndex: 0,
                          edit: false,
                          travelFrom: null,
                          travelTo: null,
                        })}
                        className="my-1 block rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 transition-transform hover:shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                            <BedDouble className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {stay.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {stay.checkInDate} → {stay.checkOutDate}
                            </p>
                          </div>
                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60" />
                        </div>
                      </Link>
                      {segment ? (
                        <TravelTimeCard
                          travelTime={travelTime}
                          href={buildPlannerHref(pathname, searchState, {
                            stayId: null,
                            stopId: null,
                            arrivalIndex: 0,
                            edit: false,
                            travelFrom: segment.from.id,
                            travelTo: segment.to.id,
                          })}
                        />
                      ) : null}
                    </div>
                  );
                });
              })()}
            </div>
          </details>
        );
      })}
      </div>
    </div>
  );
}

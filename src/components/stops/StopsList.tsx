"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BedDouble,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  GripVertical,
  MapPin,
  Plane,
} from "lucide-react";
import { format } from "date-fns";
import type {
  PlannerTimelineItem,
  Stop,
  TravelTimeEntry,
} from "@/components/map/plan-map/types";
import TravelTimeCard from "@/components/stops/TravelTimeCard";
import {
  buildPlannerHref,
  type PlannerSearchState,
} from "@/features/planner/search-params";
import { buildRouteSegments } from "@/features/planner/timeline";
import {
  applyStopSchedulesAction,
  type StopFormActionState,
} from "@/features/stops/actions";
import { applyGuestStopSchedulesAction } from "@/features/guest/actions";
import { cn } from "@/lib/utils";

const UNSCHEDULED_BUCKET = "__unscheduled__";

type Props = {
  pathname: string;
  tripId: string;
  searchState: PlannerSearchState;
  timelineItems: PlannerTimelineItem[];
  unscheduledStops: Stop[];
  travelTimes?: TravelTimeEntry[];
  accessMode?: "user" | "guest";
};

type StopCardItem = {
  id: string;
  stop: Stop;
  href: string;
  leaveByTime: string | null;
  travelHref: string | null;
  travelTime: TravelTimeEntry | null;
  isBacklog?: boolean;
};

type BucketsState = Record<string, StopCardItem[]>;

function computeLeaveBy(arrivalTime: string, durationMinutes: number): string {
  const [hStr, mStr] = arrivalTime.split(":");
  const totalMinutes =
    parseInt(hStr, 10) * 60 + parseInt(mStr, 10) - durationMinutes;
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function isDraggableStop(stop: Stop) {
  return (stop.arrivals?.length ?? 0) <= 1;
}

function buildStopHref(
  pathname: string,
  searchState: PlannerSearchState,
  stop: Stop,
  edit = false,
) {
  return buildPlannerHref(pathname, searchState, {
    stopId: stop._id,
    arrivalIndex: stop._arrivalIndex ?? 0,
    edit,
    travelFrom: null,
    travelTo: null,
  });
}

function StopCardContent({
  stop,
  href,
  leaveByTime,
  isBacklog = false,
  dragHandle,
}: Pick<StopCardItem, "stop" | "href" | "leaveByTime" | "isBacklog"> & {
  dragHandle?: React.ReactNode;
}) {
  const label = isBacklog
    ? "Save for later"
    : stop.displayTime
      ? stop.time
      : "No time set";

  return (
    <div className="relative">
      <Link
        href={href}
        className="block w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-transform hover:shadow-md active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#8b562d] shadow-sm">
            <span className="text-[9px] font-bold text-white">{stop.order}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {stop.name}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              {isBacklog ? (
                <Calendar className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Clock className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">{label}</span>
              {stop.address ? (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <MapPin className="h-3 w-3 text-muted-foreground/60" />
                  <span className="truncate text-xs text-muted-foreground">
                    {stop.address.split(",")[0]}
                  </span>
                </>
              ) : null}
            </div>
            {leaveByTime ? (
              <div className="mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-400" />
                <span className="text-xs font-medium text-orange-500">
                  Leave by {leaveByTime}
                </span>
              </div>
            ) : null}
            {stop.notes ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {stop.notes}
              </p>
            ) : null}
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
        </div>
      </Link>
      {dragHandle}
    </div>
  );
}

function FixedStopCard({ item }: { item: StopCardItem }) {
  return (
    <div className="my-1">
      <StopCardContent
        stop={item.stop}
        href={item.href}
        leaveByTime={item.leaveByTime}
        isBacklog={item.isBacklog}
      />
      {item.travelHref ? (
        <TravelTimeCard travelTime={item.travelTime} href={item.travelHref} />
      ) : null}
    </div>
  );
}

function SortableStopCard({
  item,
  sortable,
}: {
  item: StopCardItem;
  sortable: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !sortable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("my-1", isDragging && "z-10 opacity-80")}
    >
      <StopCardContent
        stop={item.stop}
        href={item.href}
        leaveByTime={item.leaveByTime}
        isBacklog={item.isBacklog}
        dragHandle={
          sortable ? (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="absolute right-10 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground/70 hover:bg-muted hover:text-foreground"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : null
        }
      />
      {item.travelHref ? (
        <TravelTimeCard travelTime={item.travelTime} href={item.travelHref} />
      ) : null}
    </div>
  );
}

function BucketDropZone({
  bucketId,
  children,
}: {
  bucketId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `bucket:${bucketId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl transition-colors",
        isOver && "bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      {children}
    </div>
  );
}

function findBucketIdByItemId(buckets: BucketsState, itemId: string) {
  return (
    Object.entries(buckets).find(([, items]) =>
      items.some((item) => item.id === itemId),
    )?.[0] ?? null
  );
}

function getOverBucketId(buckets: BucketsState, overId: string) {
  if (overId.startsWith("bucket:")) {
    return overId.replace("bucket:", "");
  }

  return findBucketIdByItemId(buckets, overId);
}

function getOverIndex(items: StopCardItem[], overId: string) {
  if (overId.startsWith("bucket:")) {
    return items.length;
  }

  const index = items.findIndex((item) => item.id === overId);
  return index >= 0 ? index : items.length;
}

function shouldKeepMovedStopTime(
  bucketItems: StopCardItem[],
  movedItemId: string,
  movedTime: string,
) {
  const movedIndex = bucketItems.findIndex((item) => item.id === movedItemId);
  if (movedIndex < 0 || !movedTime) {
    return false;
  }

  let previousTimed: string | null = null;
  for (let index = movedIndex - 1; index >= 0; index -= 1) {
    const item = bucketItems[index];
    if (item.stop.displayTime && item.stop.time) {
      previousTimed = item.stop.time;
      break;
    }
  }

  let nextTimed: string | null = null;
  for (let index = movedIndex + 1; index < bucketItems.length; index += 1) {
    const item = bucketItems[index];
    if (item.stop.displayTime && item.stop.time) {
      nextTimed = item.stop.time;
      break;
    }
  }

  if (previousTimed && previousTimed >= movedTime) {
    return false;
  }
  if (nextTimed && movedTime >= nextTimed) {
    return false;
  }

  return true;
}

function buildSchedulePayload(buckets: BucketsState, movedItemId: string) {
  const orderedBucketIds = [
    ...Object.keys(buckets)
      .filter((bucketId) => bucketId !== UNSCHEDULED_BUCKET)
      .sort((left, right) => left.localeCompare(right)),
    ...(UNSCHEDULED_BUCKET in buckets ? [UNSCHEDULED_BUCKET] : []),
  ];

  let sequence = 1;
  return orderedBucketIds.flatMap((bucketId) => {
    const items = buckets[bucketId] ?? [];
    return items.map((item) => {
      const date = bucketId === UNSCHEDULED_BUCKET ? "" : bucketId;
      const keepTime =
        item.id === movedItemId
          ? shouldKeepMovedStopTime(items, movedItemId, item.stop.time)
          : Boolean(item.stop.displayTime && item.stop.time);
      const time = date && keepTime ? item.stop.time : "";

      return {
        stopId: item.stop._id,
        date,
        time,
        sequence: sequence++,
      };
    });
  });
}

function applyPayloadToBuckets(
  buckets: BucketsState,
  payload: Array<{ stopId: string; date: string; time: string }>,
) {
  const payloadByStopId = new Map(
    payload.map((entry) => [entry.stopId, entry] as const),
  );

  const nextBuckets: BucketsState = {};
  for (const [bucketId, items] of Object.entries(buckets)) {
    nextBuckets[bucketId] = items.map((item) => {
      const next = payloadByStopId.get(item.stop._id);
      if (!next) {
        return item;
      }

      const isBacklog = !next.date;
      return {
        ...item,
        isBacklog,
        stop: {
          ...item.stop,
          date: next.date,
          time: next.time,
          displayTime: Boolean(next.time),
          isScheduled: Boolean(next.date),
        },
      };
    });
  }

  return nextBuckets;
}

export default function StopsList({
  pathname,
  tripId,
  searchState,
  timelineItems,
  unscheduledStops,
  travelTimes = [],
  accessMode = "user",
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const returnTo = buildPlannerHref(pathname, searchState, {
    stopId: null,
    stayId: null,
    arrivalIndex: 0,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });

  const grouped = useMemo(() => {
    const groups: Record<string, PlannerTimelineItem[]> = {};
    timelineItems.forEach((item) => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return groups;
  }, [timelineItems]);

  const initialBuckets = useMemo(() => {
    const nextBuckets: BucketsState = {};

    Object.entries(grouped).forEach(([date, dayItems]) => {
      const routeSegments = buildRouteSegments(dayItems);
      const segmentByFromId = new Map(
        routeSegments.map((segment) => [segment.from.id, segment]),
      );

      nextBuckets[date] = dayItems
        .flatMap((item) => {
          if (item.kind !== "stop" || !isDraggableStop(item.stop)) {
            return [];
          }

          const segment = segmentByFromId.get(item.id) ?? null;
          const travelTime =
            segment
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

          return [
            {
              id: item.id,
              stop: item.stop,
              href: buildStopHref(pathname, searchState, item.stop, false),
              leaveByTime,
              travelHref: segment
                ? buildPlannerHref(pathname, searchState, {
                    stopId: null,
                    arrivalIndex: 0,
                    edit: false,
                    travelFrom: segment.from.id,
                    travelTo: segment.to.id,
                  })
                : null,
              travelTime,
            },
          ];
        })
        .sort((left, right) => left.stop.sequence - right.stop.sequence);
    });

    nextBuckets[UNSCHEDULED_BUCKET] = unscheduledStops.map((stop) => ({
      id: stop._id,
      stop,
      href: buildStopHref(pathname, searchState, stop, true),
      leaveByTime: null,
      travelHref: null,
      travelTime: null,
      isBacklog: true,
    }));

    return nextBuckets;
  }, [grouped, pathname, searchState, travelTimes, unscheduledStops]);

  const [buckets, setBuckets] = useState(initialBuckets);

  useEffect(() => {
    setBuckets(initialBuckets);
  }, [initialBuckets]);

  if (timelineItems.length === 0 && unscheduledStops.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
          <MapPin className="h-10 w-10 text-primary/60" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No stops yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the Add stop button to search for your first place.
        </p>
      </div>
    );
  }

  const submitAction =
    accessMode === "guest" ? applyGuestStopSchedulesAction : applyStopSchedulesAction;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const sourceBucketId = findBucketIdByItemId(buckets, activeId);
    const destinationBucketId = getOverBucketId(buckets, overId);

    if (!sourceBucketId || !destinationBucketId) {
      return;
    }

    const sourceItems = buckets[sourceBucketId] ?? [];
    const destinationItems = buckets[destinationBucketId] ?? [];
    const activeIndex = sourceItems.findIndex((item) => item.id === activeId);
    if (activeIndex < 0) {
      return;
    }

    const activeItem = sourceItems[activeIndex];
    let nextBuckets = { ...buckets };

    if (sourceBucketId === destinationBucketId) {
      const overIndex = destinationItems.findIndex((item) => item.id === overId);
      if (overIndex < 0 || activeIndex === overIndex) {
        return;
      }

      nextBuckets[sourceBucketId] = arrayMove(sourceItems, activeIndex, overIndex);
    } else {
      const nextSourceItems = sourceItems.filter((item) => item.id !== activeId);
      const overIndex = getOverIndex(destinationItems, overId);
      const nextDestinationItems = [...destinationItems];
      nextDestinationItems.splice(overIndex, 0, {
        ...activeItem,
        isBacklog: destinationBucketId === UNSCHEDULED_BUCKET,
      });

      nextBuckets = {
        ...nextBuckets,
        [sourceBucketId]: nextSourceItems,
        [destinationBucketId]: nextDestinationItems,
      };
    }

    const payload = buildSchedulePayload(nextBuckets, activeId);
    const nextBucketsWithDisplay = applyPayloadToBuckets(nextBuckets, payload);
    setBuckets(nextBucketsWithDisplay);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("tripId", tripId);
      formData.set("returnTo", returnTo);
      formData.set("payload", JSON.stringify(payload));

      if (accessMode === "guest") {
        await submitAction(formData);
        return;
      }

      await (submitAction as (
        formData: FormData,
      ) => Promise<StopFormActionState | void>)(formData);
    });
  }

  function renderFixedStopCard(
    stop: Stop,
    itemId: string,
    dayItems: PlannerTimelineItem[],
  ) {
    const routeSegments = buildRouteSegments(dayItems);
    const segment = routeSegments.find((entry) => entry.from.id === itemId) ?? null;
    const travelTime =
      segment
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

    const item: StopCardItem = {
      id: itemId,
      stop,
      href: buildStopHref(pathname, searchState, stop, false),
      leaveByTime,
      travelHref: segment
        ? buildPlannerHref(pathname, searchState, {
            stopId: null,
            arrivalIndex: 0,
            edit: false,
            travelFrom: segment.from.id,
            travelTo: segment.to.id,
          })
        : null,
      travelTime,
    };

    return <FixedStopCard key={itemId} item={item} />;
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 pb-24">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="mx-auto max-w-5xl space-y-5">
          {Object.entries(grouped).map(([date, dayItems]) => {
            const formattedDate = (() => {
              try {
                return format(new Date(`${date}T00:00:00`), "EEE, MMM d, yyyy");
              } catch {
                return date;
              }
            })();

            const bucketItems = buckets[date] ?? [];
            const canSortDateBucket =
              bucketItems.length > 1 ||
              dayItems.some((item) => item.kind !== "stop");
            let bucketCursor = 0;
            const renderedItems: React.ReactNode[] = [];

            for (const item of dayItems) {
              if (item.kind === "stop") {
                if (!isDraggableStop(item.stop)) {
                  renderedItems.push(
                    renderFixedStopCard(item.stop, item.id, dayItems),
                  );
                  continue;
                }

                const bucketItem = bucketItems[bucketCursor] ?? null;
                bucketCursor += 1;
                if (bucketItem) {
                  renderedItems.push(
                    <SortableStopCard
                      key={bucketItem.id}
                      item={bucketItem}
                      sortable={canSortDateBucket}
                    />,
                  );
                }
                continue;
              }

              if (
                item.kind === "stay" &&
                item.boundary === "end" &&
                bucketCursor < bucketItems.length
              ) {
                renderedItems.push(
                  ...bucketItems.slice(bucketCursor).map((bucketItem) => (
                    <SortableStopCard
                      key={bucketItem.id}
                      item={bucketItem}
                      sortable={canSortDateBucket}
                    />
                  )),
                );
                bucketCursor = bucketItems.length;
              }

              if (item.kind === "transport") {
                const transport = item.transport;
                const segment =
                  buildRouteSegments(dayItems).find(
                    (entry) => entry.from.id === item.id,
                  ) ?? null;
                const travelTime =
                  segment
                    ? travelTimes.find(
                        (travel) =>
                          travel.fromStopId === segment.from.id &&
                          travel.toStopId === segment.to.id,
                      ) ?? null
                    : null;
                renderedItems.push(
                  <div key={item.id}>
                    <div className="my-0 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-0">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                          <Plane className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {transport.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {transport.departureTime} →{" "}
                            {transport.arrivalDate === transport.departureDate
                              ? ""
                              : `${transport.arrivalDate} `}
                            {transport.arrivalTime}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {transport.departure.name ||
                              transport.departure.address.split(",")[0]}{" "}
                            →{" "}
                            {transport.arrival.name ||
                              transport.arrival.address.split(",")[0]}
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
                  </div>,
                );
                continue;
              }

              const stay = item.stay;
              const segment =
                buildRouteSegments(dayItems).find(
                  (entry) => entry.from.id === item.id,
                ) ?? null;
              const travelTime =
                segment
                  ? travelTimes.find(
                      (travel) =>
                        travel.fromStopId === segment.from.id &&
                        travel.toStopId === segment.to.id,
                    ) ?? null
                  : null;

              renderedItems.push(
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
                        <BedDouble className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
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
                </div>,
              );
            }

            if (bucketCursor < bucketItems.length) {
              renderedItems.push(
                ...bucketItems.slice(bucketCursor).map((bucketItem) => (
                  <SortableStopCard
                    key={bucketItem.id}
                    item={bucketItem}
                    sortable={canSortDateBucket}
                  />
                )),
              );
            }

            return (
              <details
                key={date}
                open
                className="group rounded-2xl bg-muted/20 px-3 py-2"
              >
                <summary className="mb-2 flex list-none cursor-pointer items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#c38d5f]" />
                    <span className="truncate text-xs font-semibold uppercase tracking-wide text-[#9d6030]">
                      {formattedDate}
                    </span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {dayItems.length}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>

                <BucketDropZone bucketId={date}>
                  <SortableContext
                    items={bucketItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-0">
                      {renderedItems}
                      {bucketItems.length === 0 ? (
                        <div className="my-1 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                          Drop a stop here
                        </div>
                      ) : null}
                    </div>
                  </SortableContext>
                </BucketDropZone>
              </details>
            );
          })}

          <details open className="group rounded-2xl bg-muted/20 px-3 py-2">
            <summary className="mb-2 flex list-none cursor-pointer items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#c38d5f]" />
                <span className="truncate text-xs font-semibold uppercase tracking-wide text-[#9d6030]">
                  Unscheduled Stops
                </span>
                <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {(buckets[UNSCHEDULED_BUCKET] ?? []).length}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>

            <BucketDropZone bucketId={UNSCHEDULED_BUCKET}>
              <SortableContext
                items={(buckets[UNSCHEDULED_BUCKET] ?? []).map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0">
                  {(buckets[UNSCHEDULED_BUCKET] ?? []).map((item) => (
                    <SortableStopCard
                      key={item.id}
                      item={item}
                      sortable={(buckets[UNSCHEDULED_BUCKET] ?? []).length > 0}
                    />
                  ))}
                  {(buckets[UNSCHEDULED_BUCKET] ?? []).length === 0 ? (
                    <div className="my-1 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                      Drag a stop here to save it for later
                    </div>
                  ) : null}
                </div>
              </SortableContext>
            </BucketDropZone>
          </details>
        </div>
      </DndContext>
    </div>
  );
}

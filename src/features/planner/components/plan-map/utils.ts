import { DATE_COLORS, DEFAULT_MAP_CENTER } from "@/features/planner/components/plan-map/constants";
import type { PlanMapPlan, Stop } from "@/features/planner/components/plan-map/types";
import type { TripStayItem } from "@/types/trip-logistics";

const UNTYPED_STOP_SORT_TIME = "23:58";

export function getStopSortTime(stop: Pick<Stop, "time" | "displayTime">) {
  return stop.displayTime && stop.time ? stop.time : UNTYPED_STOP_SORT_TIME;
}

function compareStopSequence(left: Stop, right: Stop) {
  return left.sequence - right.sequence || left._id.localeCompare(right._id);
}

function buildUntimedBuckets(dayStops: Stop[]) {
  const baseline = [...dayStops].sort(compareStopSequence);
  const timedBaseline = baseline.filter((stop) => stop.displayTime && stop.time);

  if (timedBaseline.length === 0) {
    return {
      timedBaseline,
      beforeByTimedId: new Map<string, Stop[]>(),
      afterLast: baseline.filter((stop) => !stop.displayTime || !stop.time),
    };
  }

  const beforeByTimedId = new Map<string, Stop[]>();
  let pendingUntimed: Stop[] = [];

  for (const stop of baseline) {
    if (stop.displayTime && stop.time) {
      beforeByTimedId.set(stop._id, pendingUntimed);
      pendingUntimed = [];
      continue;
    }

    pendingUntimed.push(stop);
  }

  return {
    timedBaseline,
    beforeByTimedId,
    afterLast: pendingUntimed,
  };
}

export function orderStopsForDay(dayStops: Stop[]) {
  const baseline = [...dayStops].sort(compareStopSequence);
  const { timedBaseline, beforeByTimedId, afterLast } = buildUntimedBuckets(baseline);

  if (timedBaseline.length === 0) {
    return baseline;
  }

  const timedSorted = [...timedBaseline].sort(
    (left, right) =>
      left.time.localeCompare(right.time) ||
      compareStopSequence(left, right),
  );

  const ordered: Stop[] = [];
  for (const stop of timedSorted) {
    ordered.push(...(beforeByTimedId.get(stop._id) ?? []), stop);
  }

  ordered.push(...afterLast);
  return ordered;
}

export function sortStopsBySchedule(stops: Stop[]) {
  const scheduled = stops.filter((stop) => stop.isScheduled && stop.date);
  const unscheduled = stops
    .filter((stop) => !stop.isScheduled || !stop.date)
    .sort(compareStopSequence);

  const orderedScheduledDates = [...new Set(scheduled.map((stop) => stop.date))].sort();
  const scheduledStops = orderedScheduledDates.flatMap((date) =>
    orderStopsForDay(scheduled.filter((stop) => stop.date === date)),
  );

  return [...scheduledStops, ...unscheduled];
}

export function applyStopOrder(stops: Stop[]) {
  return sortStopsBySchedule(stops).map((stop, index) => ({
    ...stop,
    order: index + 1,
  }));
}

export function matchesDateRange(stop: Stop, from: string, to: string) {
  if (!stop.date) {
    return false;
  }

  if (from && stop.date < from) {
    return false;
  }

  if (to && stop.date > to) {
    return false;
  }

  return true;
}

export function buildFilteredStops(stops: Stop[], from: string, to: string) {
  return stops.filter(
    (stop) => stop.isScheduled && matchesDateRange(stop, from, to),
  );
}

export function buildOrderedStops(stops: Stop[], from: string, to: string) {
  return applyStopOrder(buildFilteredStops(stops, from, to));
}

export function buildExpandedStops(orderedStops: Stop[], from: string, to: string) {
  return orderedStops
    .filter((stop) => matchesDateRange(stop, from, to))
    .map((stop, index) => ({
      ...stop,
      order: stop.order || index + 1,
    }));
}

export function getDateColorMap(stops: Stop[]) {
  const uniqueDates = [
    ...new Set(stops.map((stop) => stop.date).filter(Boolean)),
  ].sort();
  const colorMap = new Map<string, string>();

  uniqueDates.forEach((date, index) => {
    colorMap.set(date, DATE_COLORS[index % DATE_COLORS.length]);
  });

  return colorMap;
}

export function getDefaultMapCenter(plan: PlanMapPlan, initialStops: Stop[]) {
  if (plan.centerLat && plan.centerLng) {
    return { lat: plan.centerLat, lng: plan.centerLng };
  }

  if (initialStops.length > 0) {
    return { lat: initialStops[0].lat, lng: initialStops[0].lng };
  }

  return DEFAULT_MAP_CENTER;
}

export function createMarkerElement(
  stop: Stop,
  markerLabel: number | string,
  pinColor: string,
) {
  const truncName = stop.name.length > 20 ? `${stop.name.slice(0, 20)}…` : stop.name;
  const [, month, day] = stop.date.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dateLabel = `${months[month - 1]} ${day}`;

  const [hour, minute] = (stop.time || "00:00").split(":").map(Number);
  const period = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 || 12;
  const timeLabel = `${hour12}:${minute.toString().padStart(2, "0")}${period}`;
  const dateTimeLabel = stop.displayTime ? `${dateLabel} · ${timeLabel}` : dateLabel;

  const element = document.createElement("div");
  element.innerHTML = `
      <div class="waypoint-marker" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.18s ease;">
        <div style="
          background:${pinColor};color:white;width:32px;height:32px;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);
          font-size:12px;font-weight:700;flex-shrink:0;">
          <span style="transform:rotate(45deg)">${markerLabel}</span>
        </div>
        <div style="
          background:white;border-radius:8px;margin-top:5px;
          padding:3px 7px 4px;min-width:72px;max-width:110px;
          box-shadow:0 2px 8px rgba(0,0,0,0.18);text-align:center;
          border:1px solid rgba(0,0,0,0.08);">
          <div style="font-size:10px;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${truncName}</div>
          <div style="font-size:9px;color:${pinColor};font-weight:600;margin-top:1px;white-space:nowrap;">${dateTimeLabel}</div>
        </div>
      </div>`;
  return element;
}

export function createUnscheduledMarkerElement(stop: Stop) {
  const truncName = stop.name.length > 20 ? `${stop.name.slice(0, 20)}…` : stop.name;

  const element = document.createElement("div");
  element.innerHTML = `
      <div class="waypoint-marker" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.18s ease;">
        <div style="
          background:#6b7280;color:white;width:32px;height:32px;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);
          font-size:12px;font-weight:700;flex-shrink:0;">
          <span style="transform:rotate(45deg)">U</span>
        </div>
        <div style="
          background:white;border-radius:8px;margin-top:5px;
          padding:3px 7px 4px;min-width:72px;max-width:110px;
          box-shadow:0 2px 8px rgba(0,0,0,0.18);text-align:center;
          border:1px solid rgba(0,0,0,0.08);">
          <div style="font-size:10px;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${truncName}</div>
          <div style="font-size:9px;color:#6b7280;font-weight:600;margin-top:1px;white-space:nowrap;">Unscheduled</div>
        </div>
      </div>`;
  return element;
}

export function createStayMarkerElement(stay: TripStayItem) {
  const truncName = stay.name.length > 20 ? `${stay.name.slice(0, 20)}…` : stay.name;
  const [, month, day] = stay.checkInDate.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dateLabel = `${months[month - 1]} ${day}${stay.checkOutDate !== stay.checkInDate ? ` - ${stay.checkOutDate.slice(5)}` : ""}`;

  const element = document.createElement("div");
  element.innerHTML = `
      <div class="waypoint-marker" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.18s ease;">
        <div style="
          background:#8b5e3c;color:white;width:34px;height:34px;
          border-radius:12px;display:flex;align-items:center;justify-content:center;
          border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);
          font-size:16px;font-weight:700;flex-shrink:0;">
          <span>⌂</span>
        </div>
        <div style="
          background:#fff8ef;border-radius:8px;margin-top:5px;
          padding:3px 7px 4px;min-width:72px;max-width:110px;
          box-shadow:0 2px 8px rgba(0,0,0,0.18);text-align:center;
          border:1px solid rgba(139,94,60,0.18);">
          <div style="font-size:10px;font-weight:700;color:#4a2f1d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${truncName}</div>
          <div style="font-size:9px;color:#8b5e3c;font-weight:600;margin-top:1px;white-space:nowrap;">Stay · ${dateLabel}</div>
        </div>
      </div>`;
  return element;
}

export function getStopSequenceIndex(stops: Stop[], currentStop: Stop) {
  return stops.findIndex((stop) => stop._id === currentStop._id);
}

import { DATE_COLORS, DEFAULT_MAP_CENTER } from "@/components/map/plan-map/constants";
import type { PlanMapPlan, Stop } from "@/components/map/plan-map/types";

const UNTYPED_STOP_SORT_TIME = "23:58";

export function getStopArrivals(stop: Stop) {
  return stop.arrivals && stop.arrivals.length > 0 ? stop.arrivals : [];
}

export function getStopSortTime(stop: Pick<Stop, "time" | "displayTime">) {
  return stop.displayTime && stop.time ? stop.time : UNTYPED_STOP_SORT_TIME;
}

export function sortStopsBySchedule(stops: Stop[]) {
  return [...stops].sort((left, right) => {
    if (left.isScheduled !== right.isScheduled) {
      return left.isScheduled ? -1 : 1;
    }

    if (!left.isScheduled && !right.isScheduled) {
      return left.sequence - right.sequence;
    }

    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }

    if (left.sequence !== right.sequence) {
      return left.sequence - right.sequence;
    }

    const leftSortTime = getStopSortTime(left);
    const rightSortTime = getStopSortTime(right);
    return leftSortTime.localeCompare(rightSortTime);
  });
}

export function applyStopOrder(stops: Stop[]) {
  return sortStopsBySchedule(stops).map((stop, index) => ({
    ...stop,
    order: index + 1,
  }));
}

export function expandStops(stops: Stop[]) {
  const expanded: Stop[] = [];

  for (const stop of stops) {
    const arrivals = getStopArrivals(stop);
    if (arrivals.length === 0) {
      expanded.push({
        ...stop,
        date: "",
        time: "",
        displayTime: false,
      });
      continue;
    }

    if (arrivals.length === 1) {
      expanded.push({
        ...stop,
        date: arrivals[0].date,
        time: arrivals[0].time ?? "",
        displayTime: Boolean(arrivals[0].time),
        _arrivalIndex: 0,
      });
      continue;
    }

    for (let index = 0; index < arrivals.length; index += 1) {
      expanded.push({
        ...stop,
        date: arrivals[index].date,
        time: arrivals[index].time ?? "",
        displayTime: Boolean(arrivals[index].time),
        _arrivalIndex: index,
      });
    }
  }

  return sortStopsBySchedule(expanded);
}

export function matchesDateRange(stop: Stop, from: string, to: string) {
  if (!from && !to) {
    return true;
  }

  return getStopArrivals(stop).some((arrival) => {
    if (from && arrival.date < from) {
      return false;
    }
    if (to && arrival.date > to) {
      return false;
    }
    return true;
  });
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
  return expandStops(orderedStops)
    .filter((stop) => {
      if (from && stop.date < from) {
        return false;
      }
      if (to && stop.date > to) {
        return false;
      }
      return true;
    })
    .map((stop, index) => ({
      ...stop,
      order: orderedStops.find((ordered) => ordered._id === stop._id)?.order ?? index + 1,
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

export function createMarkerElement(stop: Stop, orderNum: number, pinColor: string) {
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
          <span style="transform:rotate(45deg)">${stop.arrivals && stop.arrivals.length > 1 ? "M" : orderNum}</span>
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

export function getStopSequenceIndex(stops: Stop[], currentStop: Stop) {
  return stops.findIndex(
    (stop) =>
      stop._id === currentStop._id &&
      (stop._arrivalIndex ?? 0) === (currentStop._arrivalIndex ?? 0),
  );
}

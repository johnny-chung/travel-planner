import type {
  PlannerRouteNode,
  PlannerTimelineItem,
} from "@/features/planner/components/plan-map/types";
import type { Stop } from "@/features/planner/components/plan-map/types";
import type {
  TripStayItem,
  TripTransportItem,
} from "@/types/trip-logistics";
import { getStopSortTime, orderStopsForDay } from "@/features/planner/components/plan-map/utils";

export function buildStopRouteNodeId(stopId: string) {
  return stopId;
}

export function buildStayRouteNodeId(
  stayId: string,
  date: string,
  boundary: "start" | "end",
) {
  return `${stayId}:${date}:${boundary}`;
}

function intersectsDateFilter(
  startDate: string,
  endDate: string,
  from: string,
  to: string,
) {
  if (from && endDate < from) {
    return false;
  }

  if (to && startDate > to) {
    return false;
  }

  return true;
}

export function expandStayTimelineItems(
  stay: TripStayItem,
  from: string,
  to: string,
): PlannerTimelineItem[] {
  if (!intersectsDateFilter(stay.checkInDate, stay.checkOutDate, from, to)) {
    return [];
  }

  const items: PlannerTimelineItem[] = [];
  const current = new Date(`${stay.checkInDate}T00:00:00Z`);
  const end = new Date(`${stay.checkOutDate}T00:00:00Z`);

  while (current <= end) {
    const date = current.toISOString().slice(0, 10);
    const isFirstDate = date === stay.checkInDate;
    const isLastDate = date === stay.checkOutDate;

    if (!from || date >= from) {
      if (isFirstDate && isLastDate) {
        items.push(
          {
            kind: "stay",
            id: buildStayRouteNodeId(stay._id, date, "start"),
            date,
            time: "00:01",
            boundary: "start",
            stay,
          },
          {
            kind: "stay",
            id: buildStayRouteNodeId(stay._id, date, "end"),
            date,
            time: "23:59",
            boundary: "end",
            stay,
          },
        );
      } else if (isFirstDate) {
        items.push({
          kind: "stay",
          id: buildStayRouteNodeId(stay._id, date, "end"),
          date,
          time: "23:59",
          boundary: "end",
          stay,
        });
      } else if (isLastDate) {
        items.push({
          kind: "stay",
          id: buildStayRouteNodeId(stay._id, date, "start"),
          date,
          time: "00:01",
          boundary: "start",
          stay,
        });
      } else {
        items.push(
          {
            kind: "stay",
            id: buildStayRouteNodeId(stay._id, date, "start"),
            date,
            time: "00:01",
            boundary: "start",
            stay,
          },
          {
            kind: "stay",
            id: buildStayRouteNodeId(stay._id, date, "end"),
            date,
            time: "23:59",
            boundary: "end",
            stay,
          },
        );
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
    if (to && date >= to) {
      break;
    }
  }

  return items;
}

function expandTransportTimelineItems(
  transport: TripTransportItem,
  from: string,
  to: string,
): PlannerTimelineItem[] {
  if (
    !intersectsDateFilter(
      transport.departureDate,
      transport.arrivalDate,
      from,
      to,
    )
  ) {
    return [];
  }

  const items: PlannerTimelineItem[] = [];

  if (!from || transport.departureDate >= from) {
    items.push({
      kind: "transport",
      id: `${transport._id}:${transport.departureDate}:departure`,
      date: transport.departureDate,
      time: transport.departureTime,
      boundary: "departure",
      transport,
    });
  }

  if (
    transport.arrivalDate !== transport.departureDate ||
    transport.arrivalTime !== transport.departureTime
  ) {
    if (!to || transport.arrivalDate <= to) {
      items.push({
        kind: "transport",
        id: `${transport._id}:${transport.arrivalDate}:arrival`,
        date: transport.arrivalDate,
        time: transport.arrivalTime,
        boundary: "arrival",
        transport,
      });
    }
  }

  return items;
}

export function buildTimelineItems(
  stops: Stop[],
  from: string,
  to: string,
  transports: TripTransportItem[],
  stays: TripStayItem[],
) {
  const stopItems = stops
    .filter((stop) => stop.isScheduled && stop.date)
    .map((stop) => ({
      kind: "stop" as const,
      id: buildStopRouteNodeId(stop._id),
      date: stop.date,
      time: getStopSortTime(stop),
      stop,
    }));

  const fixedItems: PlannerTimelineItem[] = [
    ...transports.flatMap((transport) =>
      expandTransportTimelineItems(transport, from, to),
    ),
    ...stays.flatMap((stay) => expandStayTimelineItems(stay, from, to)),
  ];

  const dates = [
    ...new Set([...stopItems, ...fixedItems].map((item) => item.date)),
  ].sort();

  return dates.flatMap((date) => {
    const dayStops = orderStopsForDay(
      stopItems
        .filter((item) => item.date === date)
        .map((item) => item.stop),
    ).map((stop) => ({
      kind: "stop" as const,
      id: buildStopRouteNodeId(stop._id),
      date: stop.date,
      time: getStopSortTime(stop),
      stop,
    }));

    const dayFixed = fixedItems
      .filter((item) => item.date === date)
      .sort((left, right) => left.time.localeCompare(right.time));

    const merged: PlannerTimelineItem[] = [...dayStops];

    for (const item of dayFixed) {
      if (item.kind === "stay" && item.boundary === "start") {
        merged.unshift(item);
        continue;
      }

      if (item.kind === "stay" && item.boundary === "end") {
        merged.push(item);
        continue;
      }

      let insertIndex = merged.length;
      for (let index = 0; index < merged.length; index += 1) {
        const current = merged[index];
        if (current.kind === "stay" && current.boundary === "end") {
          insertIndex = index;
          break;
        }

        if (
          current.kind === "stop" &&
          current.stop.displayTime &&
          current.stop.time &&
          current.stop.time >= item.time
        ) {
          insertIndex = index;
          break;
        }
      }

      merged.splice(insertIndex, 0, item);
    }

    return merged;
  });
}

export function isRouteTimelineItem(
  item: PlannerTimelineItem,
): item is Extract<PlannerTimelineItem, { kind: "stop" | "stay" | "transport" }> {
  return item.kind === "stop" || item.kind === "stay" || item.kind === "transport";
}

export function toRouteNode(item: Extract<PlannerTimelineItem, { kind: "stop" | "stay" | "transport" }>): PlannerRouteNode {
  if (item.kind === "stop") {
    return {
      id: item.id,
      kind: "stop",
      date: item.date,
      time: item.time,
      name: item.stop.name,
      address: item.stop.address,
      lat: item.stop.lat,
      lng: item.stop.lng,
      placeId: item.stop.placeId,
      displayTime: item.stop.displayTime,
      stop: item.stop,
    };
  }

  if (item.kind === "transport") {
    const location =
      item.boundary === "arrival" ? item.transport.arrival : item.transport.departure;

    return {
      id: item.id,
      kind: "transport",
      date: item.date,
      time: item.time,
      name: location.name || item.transport.title,
      address: location.address,
      lat: location.lat ?? 0,
      lng: location.lng ?? 0,
      placeId: location.placeId,
      displayTime: true,
      transport: item.transport,
      boundary: item.boundary,
    };
  }

  return {
    id: item.id,
    kind: "stay",
    date: item.date,
    time: item.time,
    name: item.stay.name,
    address: item.stay.address,
    lat: item.stay.lat,
    lng: item.stay.lng,
    placeId: item.stay.placeId,
    displayTime: false,
    stay: item.stay,
    boundary: item.boundary,
  };
}

function toSegmentRouteNode(
  item: Extract<PlannerTimelineItem, { kind: "stop" | "stay" | "transport" }>,
  role: "from" | "to",
): PlannerRouteNode {
  if (item.kind !== "transport") {
    return toRouteNode(item);
  }

  const location =
    role === "from" ? item.transport.arrival : item.transport.departure;

  return {
    id: item.id,
    kind: "transport",
    date: item.date,
    time: item.time,
    name: location.name || item.transport.title,
    address: location.address,
    lat: location.lat ?? 0,
    lng: location.lng ?? 0,
    placeId: location.placeId,
    displayTime: true,
    transport: item.transport,
    boundary: item.boundary,
  };
}

function isSameStayBoundaryPair(left: PlannerRouteNode, right: PlannerRouteNode) {
  return (
    left.kind === "stay" &&
    right.kind === "stay" &&
    left.stay?._id === right.stay?._id &&
    left.date === right.date
  );
}

function isSameTransportBoundaryPair(left: PlannerRouteNode, right: PlannerRouteNode) {
  return (
    left.kind === "transport" &&
    right.kind === "transport" &&
    left.transport?._id === right.transport?._id
  );
}

export function buildRouteNodes(timelineItems: PlannerTimelineItem[]) {
  return timelineItems.filter(isRouteTimelineItem).map(toRouteNode);
}

export function buildRouteSegments(timelineItems: PlannerTimelineItem[]) {
  const segments: Array<{ from: PlannerRouteNode; to: PlannerRouteNode }> = [];

  for (let index = 0; index < timelineItems.length - 1; index += 1) {
    const fromItem = timelineItems[index];
    const toItem = timelineItems[index + 1];
    if (!isRouteTimelineItem(fromItem) || !isRouteTimelineItem(toItem)) {
      continue;
    }

    const fromNode = toSegmentRouteNode(fromItem, "from");
    const toNode = toSegmentRouteNode(toItem, "to");
    if (fromNode.date !== toNode.date) {
      continue;
    }
    if (isSameStayBoundaryPair(fromNode, toNode)) {
      continue;
    }
    if (fromNode.kind === "transport" && toNode.kind === "transport") {
      continue;
    }
    if (isSameTransportBoundaryPair(fromNode, toNode)) {
      continue;
    }

    segments.push({ from: fromNode, to: toNode });
  }

  return segments;
}

export function buildEndpointPrefixPattern(sourceId: string) {
  const escaped = sourceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?::|$)`);
}

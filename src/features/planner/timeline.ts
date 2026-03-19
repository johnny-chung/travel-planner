import type {
  PlannerRouteNode,
  PlannerTimelineItem,
} from "@/components/map/plan-map/types";
import type { Stop } from "@/components/map/plan-map/types";
import type {
  TripStayItem,
  TripTransportItem,
} from "@/types/trip-logistics";

export function buildStopRouteNodeId(stopId: string, arrivalIndex = 0) {
  return `${stopId}:${arrivalIndex}`;
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

  return items;
}

export function buildTimelineItems(
  stops: Stop[],
  from: string,
  to: string,
  transports: TripTransportItem[],
  stays: TripStayItem[],
) {
  const items: PlannerTimelineItem[] = [
    ...stops.map((stop) => ({
      kind: "stop" as const,
      id: buildStopRouteNodeId(stop._id, stop._arrivalIndex ?? 0),
      date: stop.date,
      time: stop.time,
      stop,
    })),
    ...transports.flatMap((transport) =>
      expandTransportTimelineItems(transport, from, to),
    ),
    ...stays.flatMap((stay) => expandStayTimelineItems(stay, from, to)),
  ];

  return items.sort(
    (left, right) =>
      left.date.localeCompare(right.date) || left.time.localeCompare(right.time),
  );
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

    const fromNode = toRouteNode(fromItem);
    const toNode = toRouteNode(toItem);
    if (fromNode.date !== toNode.date) {
      continue;
    }
    if (isSameStayBoundaryPair(fromNode, toNode)) {
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
  return new RegExp(`^${escaped}:`);
}

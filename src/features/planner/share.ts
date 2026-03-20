import { format } from "date-fns";
import type { PlannerTimelineItem } from "@/features/planner/components/plan-map/types";

function formatDayLabel(date: string) {
  try {
    return format(new Date(`${date}T00:00:00`), "EEE, MMM d, yyyy");
  } catch {
    return date;
  }
}

function buildMapLink(item: Extract<PlannerTimelineItem, { kind: "stop" | "stay" }>) {
  const lat = item.kind === "stop" ? item.stop.lat : item.stay.lat;
  const lng = item.kind === "stop" ? item.stop.lng : item.stay.lng;
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://maps.google.com/?q=${lat},${lng}`;
  }

  const address = item.kind === "stop" ? item.stop.address : item.stay.address;
  return address
    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
    : "";
}

function formatItemLine(item: PlannerTimelineItem) {
  if (item.kind === "stop") {
    const timeLabel = item.stop.displayTime ? `${item.time} ` : "";
    return `${timeLabel}${item.stop.name}`.trim();
  }

  if (item.kind === "stay") {
    return `Stay: ${item.stay.name}`;
  }

  const label =
    item.transport.type === "flight" ? item.transport.title : item.transport.title;
  const location =
    item.boundary === "arrival"
      ? item.transport.arrival.name || item.transport.arrival.address
      : item.transport.departure.name || item.transport.departure.address;
  const prefix = item.boundary === "arrival" ? "Arrive" : "Depart";
  return `${item.time} ${prefix}: ${label}${location ? ` (${location})` : ""}`;
}

export function buildPlannerShareText(
  planName: string,
  timelineItems: PlannerTimelineItem[],
) {
  const lines: string[] = [`${planName} itinerary`, ""];

  if (timelineItems.length === 0) {
    lines.push("No scheduled items yet.");
    return lines.join("\n");
  }

  const grouped = new Map<string, PlannerTimelineItem[]>();
  for (const item of timelineItems) {
    const items = grouped.get(item.date) ?? [];
    items.push(item);
    grouped.set(item.date, items);
  }

  for (const [date, items] of grouped) {
    lines.push(formatDayLabel(date));
    for (const item of items) {
      lines.push(formatItemLine(item));
      if (item.kind === "stop" || item.kind === "stay") {
        const mapLink = buildMapLink(item);
        if (mapLink) {
          lines.push(`Map: ${mapLink}`);
        }
      }
    }
    lines.push("");
  }

  while (lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

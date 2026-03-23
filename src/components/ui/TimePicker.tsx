"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  clearLabel?: string;
};

const HOURS = [
  ...Array.from({ length: 16 }, (_, i) => i + 8),
  ...Array.from({ length: 8 }, (_, i) => i),
];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function fmt12(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:00 ${period}`;
}

function buildTime(hour: number | null, minute: number | null) {
  const safeHour = hour ?? 0;
  const safeMinute = minute ?? 0;
  return `${safeHour.toString().padStart(2, "0")}:${safeMinute
    .toString()
    .padStart(2, "0")}`;
}

export default function TimePicker({
  value,
  onChange,
  className,
  clearLabel,
}: Props) {
  const [rawHour, rawMinute] = value
    ? value.split(":").map((part) => Number(part))
    : [NaN, NaN];

  const hour = Number.isFinite(rawHour) ? rawHour : null;
  const minute = Number.isFinite(rawMinute) ? rawMinute : null;
  const snappedMinute =
    minute !== null ? (Math.round(minute / 5) * 5) % 60 : null;

  return (
    <div className={cn("flex gap-2", className)}>
      <label className="relative flex-1">
        <span className="sr-only">Hour</span>
        <select
          value={hour !== null ? String(hour) : ""}
          onChange={(event) => {
            const nextHour =
              event.target.value === "" ? null : Number(event.target.value);
            onChange(buildTime(nextHour, snappedMinute));
          }}
          className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Hour</option>
          {HOURS.map((item) => (
            <option key={item} value={item}>
              {fmt12(item)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </label>

      <label className="relative w-24 shrink-0">
        <span className="sr-only">Minute</span>
        <select
          value={snappedMinute !== null ? String(snappedMinute) : ""}
          onChange={(event) => {
            const nextMinute =
              event.target.value === "" ? null : Number(event.target.value);
            onChange(buildTime(hour, nextMinute));
          }}
          className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Min</option>
          {MINUTES.map((item) => (
            <option key={item} value={item}>
              {item.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </label>

      {clearLabel ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 rounded-xl px-3"
          onClick={() => onChange("")}
          disabled={!value}
        >
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseDateString(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toDateString(value?: Date) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitialMonth(
  range: DateRange | undefined,
  highlightedDates: Date[],
) {
  return range?.from ?? highlightedDates[0] ?? new Date();
}

type Props = {
  fromValue: string;
  toValue: string;
  onChange?: (value: { from: string; to: string }) => void;
  fromName?: string;
  toName?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  highlightDates?: string[];
  highlightLabel?: string;
};

export default function DateRangePicker({
  fromValue,
  toValue,
  onChange,
  fromName,
  toName,
  disabled = false,
  className,
  placeholder = "Pick a date range",
  highlightDates = [],
  highlightLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [internalRange, setInternalRange] = useState({
    from: fromValue,
    to: toValue,
  });
  const effectiveFrom = onChange ? fromValue : internalRange.from;
  const effectiveTo = onChange ? toValue : internalRange.to;
  const range = useMemo<DateRange | undefined>(
    () => ({
      from: parseDateString(effectiveFrom),
      to: parseDateString(effectiveTo),
    }),
    [effectiveFrom, effectiveTo],
  );
  const highlightedDates = useMemo(
    () =>
      highlightDates
        .map((date) => parseDateString(date))
        .filter(Boolean) as Date[],
    [highlightDates],
  );
  const initialMonth = useMemo(
    () => getInitialMonth(range, highlightedDates),
    [highlightedDates, range],
  );

  function handleChange(nextValue: { from: string; to: string }) {
    if (onChange) {
      onChange(nextValue);
      return;
    }
    setInternalRange(nextValue);
  }

  const label = range?.from
    ? range.to
      ? `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`
      : format(range.from, "MMM d, yyyy")
    : placeholder;

  return (
    <div className={cn("space-y-0", className)}>
      {fromName ? <input type="hidden" name={fromName} value={effectiveFrom} /> : null}
      {toName ? <input type="hidden" name={toName} value={effectiveTo} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          className={cn(
            buttonVariants({
              variant: "outline",
              className:
                "h-11 w-full justify-between rounded-xl px-3 text-left font-normal",
            }),
            !range?.from && "text-muted-foreground",
          )}
        >
            <span className="truncate">{label}</span>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          collisionAvoidance={{
            side: "none",
            align: "shift",
            fallbackAxisSide: "none",
          }}
          className="w-auto p-2"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={initialMonth}
            selected={range}
            onSelect={(nextRange) => {
              handleChange({
                from: toDateString(nextRange?.from),
                to: toDateString(nextRange?.to),
              });
            }}
            numberOfMonths={2}
            modifiers={{ highlighted: highlightedDates }}
            modifiersClassNames={{
              highlighted:
                "bg-emerald-500/15 font-semibold text-emerald-900 dark:text-emerald-100",
            }}
          />
          <div className="flex items-center justify-between px-2 pb-1 pt-2">
            <span className="text-xs text-muted-foreground">
              {highlightLabel ?? "\u00A0"}
            </span>
            {effectiveFrom || effectiveTo ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleChange({ from: "", to: "" })}
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

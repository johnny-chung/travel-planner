"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
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
  selectedDate: Date | undefined,
  highlightedDates: Date[],
) {
  return selectedDate ?? highlightedDates[0] ?? new Date();
}

type Props = {
  value: string;
  onChange?: (value: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  highlightDates?: string[];
  highlightLabel?: string;
};

export default function DatePicker({
  value,
  onChange,
  name,
  id,
  disabled = false,
  placeholder = "Pick a date",
  className,
  highlightDates = [],
  highlightLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const effectiveValue = onChange ? value : internalValue;
  const selectedDate = useMemo(
    () => parseDateString(effectiveValue),
    [effectiveValue],
  );
  const highlightedDates = useMemo(
    () =>
      highlightDates
        .map((date) => parseDateString(date))
        .filter(Boolean) as Date[],
    [highlightDates],
  );
  const initialMonth = useMemo(
    () => getInitialMonth(selectedDate, highlightedDates),
    [highlightedDates, selectedDate],
  );

  function handleChange(nextValue: string) {
    if (onChange) {
      onChange(nextValue);
      return;
    }
    setInternalValue(nextValue);
  }

  return (
    <div className={cn("space-y-0", className)}>
      {name ? <input type="hidden" name={name} value={effectiveValue} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            buttonVariants({
              variant: "outline",
              className:
                "h-11 w-full justify-between rounded-xl px-3 text-left font-normal",
            }),
            !selectedDate && "text-muted-foreground",
          )}
        >
            <span className="truncate">
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : placeholder}
            </span>
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
            mode="single"
            defaultMonth={initialMonth}
            selected={selectedDate}
            onSelect={(nextDate) => {
              handleChange(toDateString(nextDate));
            }}
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
            {effectiveValue ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleChange("")}
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

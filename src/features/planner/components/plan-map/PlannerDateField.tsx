"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Props = {
  id: string
  name: string
  label: string
  value: string
  tripDates: string[]
}

function parseDateString(value: string) {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toDateString(value?: Date) {
  if (!value) return ""
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, "0")
  const day = `${value.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function PlannerDateField({
  id,
  name,
  label,
  value,
  tripDates,
}: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(value)

  const tripDateValues = useMemo(
    () => tripDates.map((tripDate) => parseDateString(tripDate)).filter(Boolean) as Date[],
    [tripDates],
  )
  const selectedDate = useMemo(() => parseDateString(selected), [selected])

  return (
    <div className="flex-1 space-y-1">
      <label htmlFor={id} className="text-xs text-gray-500">
        {label}
      </label>
      <input type="hidden" name={name} value={selected} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-sm transition-colors hover:bg-muted/40",
            selected ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
          </span>
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(nextDate) => {
              setSelected(toDateString(nextDate))
              if (nextDate) {
                setOpen(false)
              }
            }}
            modifiers={{ tripDate: tripDateValues }}
            modifiersClassNames={{
              tripDate:
                "font-semibold text-primary underline decoration-primary/40 underline-offset-4",
            }}
          />
          <div className="flex justify-between px-2 pb-1 pt-2">
            <span className="text-xs text-muted-foreground">
              Trip days are highlighted
            </span>
            {selected ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setSelected("")}
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

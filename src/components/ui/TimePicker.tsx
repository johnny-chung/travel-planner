"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value: string;            // "HH:mm" 24-hour format
  onChange: (v: string) => void;
  className?: string;
};

const HOURS = [...Array.from({ length: 16 }, (_, i) => i + 8), ...Array.from({ length: 8 }, (_, i) => i)];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function fmt12(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const h12    = h % 12 || 12;
  return `${h12}:00 ${period}`;
}

export default function TimePicker({ value, onChange, className }: Props) {
  const parts = value ? value.split(":").map(Number) : [null, null];
  const h = parts[0];
  const m = parts[1];

  // Snap existing minute to nearest 5-min when editing
  const snappedM = m !== null ? Math.round(m / 5) * 5 % 60 : null;

  function setHour(hourStr: string | null) {
    if (hourStr === null) return;
    const min = snappedM !== null ? snappedM : 0;
    onChange(`${hourStr.padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
  }

  function setMin(minStr: string | null) {
    if (minStr === null) return;
    const hour = h !== null ? h : 0;
    onChange(`${hour.toString().padStart(2, "0")}:${minStr.padStart(2, "0")}`);
  }

  return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      <Select value={h !== null ? String(h) : ""} onValueChange={setHour}>
        <SelectTrigger className="rounded-xl h-11 flex-1 text-sm">
          <SelectValue placeholder="Hour">
            {h !== null ? fmt12(h) : "Hour"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-52">
          {HOURS.map((i) => (
            <SelectItem key={i} value={String(i)}>
              {fmt12(i)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={snappedM !== null ? String(snappedM) : ""} onValueChange={setMin}>
        <SelectTrigger className="rounded-xl h-11 w-24 text-sm">
          <SelectValue placeholder="Min">
            {snappedM !== null ? snappedM.toString().padStart(2, "0") : "Min"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((i) => (
            <SelectItem key={i} value={String(i)}>
              {i.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

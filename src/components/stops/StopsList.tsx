"use client";

import { MapPin, Clock, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { Stop } from "@/components/map/PlanMapClient";
import TravelTimeCard from "@/components/stops/TravelTimeCard";

type TravelTimeEntry = {
  _id: string; fromStopId: string; toStopId: string;
  mode: "TRANSIT" | "DRIVE" | "WALK"; durationMinutes: number;
};

type Props = {
  stops: Stop[];
  onSelect: (stop: Stop) => void;
  travelTimes?: TravelTimeEntry[];
  onEditTravelMode?: (fromStopId: string, toStopId: string, currentMode: "TRANSIT" | "DRIVE" | "WALK") => void;
};

function computeLeaveBy(arrivalTime: string, durationMinutes: number): string {
  const [hStr, mStr] = arrivalTime.split(":");
  const totalMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) - durationMinutes;
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function StopsList({ stops, onSelect, travelTimes = [], onEditTravelMode }: Props) {
  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-primary/60" />
        </div>
        <h3 className="font-semibold text-foreground text-lg">No stops yet</h3>
        <p className="text-muted-foreground text-sm mt-1">Switch to Map view and tap a location to add your first stop</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, Stop[]> = {};
  stops.forEach((s) => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-5 pb-4">
      <div className="max-w-5xl mx-auto space-y-5">
      {Object.entries(grouped).map(([date, dayStops]) => {
        const formattedDate = (() => {
          try { return format(new Date(date + "T00:00:00"), "EEE, MMM d, yyyy"); }
          catch { return date; }
        })();

        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{formattedDate}</span>
            </div>
            <div className="space-y-0">
              {dayStops.map((stop, idx) => {
                const nextStop = idx < dayStops.length - 1 ? dayStops[idx + 1] : null;
                const travelTime = nextStop
                  ? travelTimes.find(t => t.fromStopId === stop._id && t.toStopId === nextStop._id) ?? null
                  : null;

                // Leave by = next stop's arrival time minus travel duration
                const leaveByTime = (travelTime && nextStop)
                  ? computeLeaveBy(nextStop.time, travelTime.durationMinutes)
                  : null;

                return (
                  <div key={stop._id}>
                    <button
                      className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3 text-left active:scale-[0.98] transition-transform hover:shadow-md"
                      onClick={() => onSelect(stop)}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-[9px] font-bold">{stop.order}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{stop.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{stop.time}</span>
                          {stop.address && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <MapPin className="w-3 h-3 text-muted-foreground/60" />
                              <span className="text-xs text-muted-foreground truncate">{stop.address.split(",")[0]}</span>
                            </>
                          )}
                        </div>
                        {leaveByTime && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-orange-400" />
                            <span className="text-xs text-orange-500 font-medium">Leave by {leaveByTime}</span>
                          </div>
                        )}
                        {stop.notes && (
                          <p className="text-xs text-muted-foreground truncate mt-1">{stop.notes}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                    </button>
                    {nextStop && (
                      <TravelTimeCard
                        travelTime={travelTime}
                        onEdit={() => onEditTravelMode?.(stop._id, nextStop._id, travelTime?.mode ?? "TRANSIT")}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

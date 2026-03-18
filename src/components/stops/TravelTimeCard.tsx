"use client";
import { Bus, Car, Footprints, Pencil } from "lucide-react";

type TravelMode = "TRANSIT" | "DRIVE" | "WALK";

type TravelTime = {
  _id: string; fromStopId: string; toStopId: string;
  mode: TravelMode; durationMinutes: number;
};

type Props = {
  travelTime: TravelTime | null;
  onEdit: () => void;
};

const ModeIcon = { TRANSIT: Bus, DRIVE: Car, WALK: Footprints } as const;

export default function TravelTimeCard({ travelTime, onEdit }: Props) {
  if (!travelTime) return null;
  const Icon = ModeIcon[travelTime.mode];
  return (
    <div className="flex items-center justify-center gap-2 my-1.5 px-4">
      <div className="flex-1 h-px bg-border/40" />
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{travelTime.durationMinutes} min</span>
        <button onClick={onEdit} className="p-0.5 rounded hover:bg-muted transition-colors" title="Change travel mode">
          <Pencil className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}


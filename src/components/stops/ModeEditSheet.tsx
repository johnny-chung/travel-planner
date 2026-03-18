"use client";
import { useState } from "react";
import { Bus, Car, Footprints, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TravelMode = "TRANSIT" | "DRIVE" | "WALK";

const MODES: { value: TravelMode; label: string; Icon: React.ElementType }[] = [
  { value: "TRANSIT", label: "Transit", Icon: Bus },
  { value: "DRIVE", label: "Drive", Icon: Car },
  { value: "WALK", label: "Walk", Icon: Footprints },
];

type Props = {
  open: boolean;
  currentMode: TravelMode;
  fromStopName: string;
  toStopName: string;
  onClose: () => void;
  onConfirm: (mode: TravelMode) => Promise<void>;
};

export default function ModeEditSheet({ open, currentMode, fromStopName, toStopName, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<TravelMode>(currentMode);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try { await onConfirm(selected); onClose(); }
    finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl mx-4 max-w-sm">
        <DialogHeader>
          <DialogTitle>Travel Mode</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1 truncate">
          {fromStopName} → {toStopName}
        </p>
        <div className="grid grid-cols-3 gap-3 py-2">
          {MODES.map(({ value, label, Icon }) => (
            <button key={value} onClick={() => setSelected(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${
                selected === value ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
              }`}>
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        <DialogFooter className="gap-2 flex-row">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleConfirm} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

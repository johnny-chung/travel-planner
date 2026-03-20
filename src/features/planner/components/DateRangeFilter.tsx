"use client";

import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onClear: () => void;
};

export default function DateRangeFilter({ from, to, onFromChange, onToChange, onClear }: Props) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm flex-shrink-0">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-gray-500">From</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-9 rounded-xl text-sm"
        />
      </div>
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-gray-500">To</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="h-9 rounded-xl text-sm"
        />
      </div>
      {(from || to) && (
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={onClear}>
          <X className="w-4 h-4" />
        </Button>
      )}
      </div>
    </div>
  );
}

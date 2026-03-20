"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  name: string;
  label: string;
  description?: string;
  defaultChecked: boolean;
};

export default function PlannerFilterSwitch({
  id,
  name,
  label,
  description,
  defaultChecked,
}: Props) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/80 px-4 py-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <input type="hidden" name={name} value={checked ? "1" : ""} />
      <Switch id={id} checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}

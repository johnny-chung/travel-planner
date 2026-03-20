"use client";

import { useCallback } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PlannerPrintPrompt() {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="no-print sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-sm items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Printable itinerary</p>
          <p className="text-xs text-muted-foreground">
            Use your browser&apos;s Save as PDF option.
          </p>
        </div>
        <Button
          type="button"
          className="h-10 rounded-full px-4"
          onClick={handlePrint}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
}

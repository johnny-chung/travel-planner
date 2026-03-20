"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

type Props = {
  href: string;
  iconOnly?: boolean;
  className?: string;
};

export default function PlannerPrintButton({
  href,
  iconOnly = false,
  className = "",
}: Props) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label="Download itinerary PDF"
    >
      <span className="inline-flex items-center gap-2">
        <Printer className="h-4 w-4" />
        {iconOnly ? <span className="sr-only">Save as PDF</span> : "Save as PDF"}
      </span>
    </Link>
  );
}

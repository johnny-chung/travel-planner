"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Printer } from "lucide-react";
import { getClientDictionary } from "@/features/i18n/client";

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
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={dictionary.planner.saveAsPdf}
    >
      <span className="inline-flex items-center gap-2">
        <Printer className="h-4 w-4" />
        {iconOnly ? (
          <span className="sr-only">{dictionary.planner.saveAsPdf}</span>
        ) : (
          dictionary.planner.saveAsPdf
        )}
      </span>
    </Link>
  );
}

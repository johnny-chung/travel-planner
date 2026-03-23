"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Printer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getClientDictionary } from "@/features/i18n/client";
import { cn } from "@/lib/utils";

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
      className={cn(
        buttonVariants({
          variant: "outline",
          size: iconOnly ? "icon-lg" : "default",
        }),
        className,
      )}
      title={dictionary.planner.saveAsPdf}
      aria-label={dictionary.planner.saveAsPdf}
    >
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <Printer className="h-4 w-4" />
        {iconOnly ? (
          <span className="sr-only">{dictionary.planner.saveAsPdf}</span>
        ) : (
          <span>{dictionary.planner.saveAsPdf}</span>
        )}
      </span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppFooter() {
  const pathname = usePathname();

  if (pathname.endsWith("/plan/print")) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/35 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>Copyright © {currentYear} GoodmanLtd</div>
        <div className="flex items-center gap-2">
          <Link
            href="/privacy"
            className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
          >
            Privacy
          </Link>
          <a
            href="mailto:johnny@goodmanltd.com"
            className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}

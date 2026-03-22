"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getClientDictionary, getClientLocale } from "@/features/i18n/client";
import { defaultLocale, localizeHref, removeLocaleFromPathname } from "@/features/i18n/config";

export default function AppFooter() {
  const pathname = usePathname();
  const locale = pathname ? getClientLocale(pathname) : defaultLocale;
  const dictionary = pathname ? getClientDictionary(pathname) : getClientDictionary(`/${defaultLocale}`);
  const cleanPathname = pathname ? removeLocaleFromPathname(pathname) : "/";

  if (cleanPathname.endsWith("/plan/print")) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const copyright = dictionary.footer.copyright.replace("{year}", String(currentYear));

  return (
    <footer className="border-t border-border bg-muted/35 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>{copyright}</div>
        <div className="flex items-center gap-2">
          <Link
            href={localizeHref(locale, "/privacy")}
            className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
          >
            {dictionary.common.privacy}
          </Link>
          <a
            href="mailto:johnny@goodmanltd.com"
            className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
          >
            {dictionary.common.support}
          </a>
        </div>
      </div>
    </footer>
  );
}

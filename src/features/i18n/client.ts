"use client";

import { defaultLocale, getLocaleFromPathname, type AppLocale } from "@/features/i18n/config";
import { getDictionary } from "@/features/i18n/dictionaries";

export function getClientLocale(pathname: string): AppLocale {
  return getLocaleFromPathname(pathname) ?? defaultLocale;
}

export function getClientDictionary(pathname: string) {
  return getDictionary(getClientLocale(pathname));
}

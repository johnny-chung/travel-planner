import { cookies, headers } from "next/headers";
import { defaultLocale, isSupportedLocale, type AppLocale } from "@/features/i18n/config";
import { getDictionary } from "@/features/i18n/dictionaries";

export async function getRequestLocale(): Promise<AppLocale> {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-locale");

  if (isSupportedLocale(headerLocale)) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;

  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

export async function getRequestDictionary() {
  const locale = await getRequestLocale();

  return {
    locale,
    dictionary: getDictionary(locale),
  };
}

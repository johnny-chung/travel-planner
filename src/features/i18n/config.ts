export const locales = ["de", "en", "es", "fr", "jp", "pt", "sc", "tc"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export function isSupportedLocale(
  value: string | null | undefined,
): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const segments = pathname.split("/");
  const candidate = segments[1];

  return isSupportedLocale(candidate) ? candidate : null;
}

export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);

  if (!locale) {
    return pathname || "/";
  }

  const cleanPathname = pathname.slice(locale.length + 1);
  return cleanPathname.startsWith("/")
    ? cleanPathname
    : cleanPathname
      ? `/${cleanPathname}`
      : "/";
}

export function addLocaleToPathname(
  locale: AppLocale,
  pathname: string,
): string {
  if (!pathname.startsWith("/")) {
    return addLocaleToPathname(locale, `/${pathname}`);
  }

  if (getLocaleFromPathname(pathname)) {
    return pathname;
  }

  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

export function localizeHref(locale: AppLocale, href: string): string {
  if (!href.startsWith("/")) {
    return href;
  }

  return addLocaleToPathname(locale, href);
}

export function switchLocaleInPathname(
  pathname: string,
  locale: AppLocale,
): string {
  const cleanPathname = removeLocaleFromPathname(pathname);
  return addLocaleToPathname(locale, cleanPathname);
}

export function toHtmlLang(locale: AppLocale): string {
  switch (locale) {
    case "jp":
      return "ja";
    case "sc":
      return "zh-Hans";
    case "tc":
      return "zh-Hant";
    default:
      return locale;
  }
}

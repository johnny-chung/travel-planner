import type { MetadataRoute } from "next";
import { locales } from "@/features/i18n/config";
import { buildAbsoluteUrl, getSiteUrl } from "@/features/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  const localizedPrivatePaths = locales.flatMap((locale) => [
    `/${locale}/api/`,
    `/${locale}/auth/`,
    `/${locale}/login`,
    `/${locale}/trips`,
    `/${locale}/plans`,
    `/${locale}/profile`,
    `/${locale}/orders`,
    `/${locale}/expense`,
    `/${locale}/notifications`,
    `/${locale}/upgrade`,
    `/${locale}/donate`,
    `/${locale}/try/`,
  ]);

  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/auth/",
          "/login",
          "/trips",
          "/plans",
          "/profile",
          "/orders",
          "/expense",
          "/notifications",
          "/upgrade",
          "/donate",
          "/try/",
          ...localizedPrivatePaths,
        ],
      },
    ],
    sitemap: buildAbsoluteUrl("/sitemap.xml"),
    host: getSiteUrl().toString(),
  };
}

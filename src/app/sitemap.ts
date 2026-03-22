import type { MetadataRoute } from "next";
import { localizeHref, locales } from "@/features/i18n/config";
import { buildAbsoluteUrl } from "@/features/seo/metadata";
import { marketingFeatureSlugs } from "@/features/marketing/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return locales.flatMap((locale) => [
    {
      url: buildAbsoluteUrl(localizeHref(locale, "/")),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: buildAbsoluteUrl(localizeHref(locale, "/privacy")),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    },
    {
      url: buildAbsoluteUrl(localizeHref(locale, "/try")),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...marketingFeatureSlugs.map((slug) => ({
      url: buildAbsoluteUrl(localizeHref(locale, `/features/${slug}`)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]);
}

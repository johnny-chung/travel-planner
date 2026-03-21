import type { MetadataRoute } from "next";
import { buildAbsoluteUrl } from "@/features/seo/metadata";
import { marketingFeaturePages } from "@/features/marketing/content";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: buildAbsoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: buildAbsoluteUrl("/privacy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: buildAbsoluteUrl("/try"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...marketingFeaturePages.map((page) => ({
      url: buildAbsoluteUrl(`/features/${page.slug}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

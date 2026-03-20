import type { MetadataRoute } from "next";
import { buildAbsoluteUrl } from "@/features/seo/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: buildAbsoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}


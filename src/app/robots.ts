import type { MetadataRoute } from "next";
import { buildAbsoluteUrl, getSiteUrl } from "@/features/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/try"],
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
        ],
      },
    ],
    sitemap: buildAbsoluteUrl("/sitemap.xml"),
    host: getSiteUrl().toString(),
  };
}

import type { Metadata } from "next";
import {
  SITE_NAME,
  buildAbsoluteUrl,
  buildLocaleAlternates,
} from "@/features/seo/metadata";
import { localizeHref, type AppLocale } from "@/features/i18n/config";
import { getDictionary } from "@/features/i18n/dictionaries";
import { BRAND_LOGO_SRC } from "@/components/layout/brand-assets";

export type MarketingFeaturePage = {
  slug:
    | "itinerary-planner"
    | "route-planner"
    | "group-trip-planning"
    | "travel-expense-tracker"
    | "trip-pdf-export";
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  mediaType: "image" | "video";
  mediaSrc: string;
  mediaAlt: string;
  bullets: string[];
};

export const marketingFeatureSlugs = [
  "itinerary-planner",
  "route-planner",
  "group-trip-planning",
  "travel-expense-tracker",
  "trip-pdf-export",
] as const satisfies readonly MarketingFeaturePage["slug"][];

const marketingFeatureMedia = {
  "itinerary-planner": {
    mediaType: "video",
    mediaSrc: "/material/Recording_1.mp4",
    mediaAlt: "Itinerary planner recording",
  },
  "route-planner": {
    mediaType: "image",
    mediaSrc: "/material/Compass.png",
    mediaAlt: "Compass illustration",
  },
  "group-trip-planning": {
    mediaType: "video",
    mediaSrc: "/material/Recording_2.mp4",
    mediaAlt: "Group trip planning recording",
  },
  "travel-expense-tracker": {
    mediaType: "video",
    mediaSrc: "/material/Recording_3.mp4",
    mediaAlt: "Travel expense tracking recording",
  },
  "trip-pdf-export": {
    mediaType: "image",
    mediaSrc: "/material/Scroll.png",
    mediaAlt: "Scroll illustration",
  },
} satisfies Record<MarketingFeaturePage["slug"], Pick<MarketingFeaturePage, "mediaType" | "mediaSrc" | "mediaAlt">>;

export function getMarketingFeaturePage(slug: string, locale: AppLocale = "en") {
  const dictionary = getDictionary(locale);
  const pages = dictionary.marketing.pages;

  const localizedPage = pages[slug as keyof typeof pages];
  if (!localizedPage) {
    return null;
  }

  return {
    slug: slug as MarketingFeaturePage["slug"],
    ...marketingFeatureMedia[slug as MarketingFeaturePage["slug"]],
    eyebrow: localizedPage.eyebrow,
    title: localizedPage.title,
    description: localizedPage.description,
    intro: localizedPage.intro,
    bullets: localizedPage.bullets,
  } satisfies MarketingFeaturePage;
}

export function getMarketingFeatureMetadata(
  page: MarketingFeaturePage,
  locale: AppLocale = "en",
): Metadata {
  const localizedPath = localizeHref(locale, `/features/${page.slug}`);

  return {
    title: page.title,
    description: page.description,
    alternates: buildLocaleAlternates(locale, `/features/${page.slug}`),
    openGraph: {
      title: `${page.title} | ${SITE_NAME}`,
      description: page.description,
      url: buildAbsoluteUrl(localizedPath),
      type: "article",
      images: page.mediaType === "image" ? [page.mediaSrc] : [BRAND_LOGO_SRC],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | ${SITE_NAME}`,
      description: page.description,
      images: page.mediaType === "image" ? [page.mediaSrc] : [BRAND_LOGO_SRC],
    },
    keywords: [
      page.eyebrow.toLowerCase(),
      "travel planner",
      "trip planning app",
      page.description,
    ],
  };
}

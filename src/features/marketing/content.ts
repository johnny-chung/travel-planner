import type { Metadata } from "next";
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  buildAbsoluteUrl,
} from "@/features/seo/metadata";

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

export const marketingFeaturePages: MarketingFeaturePage[] = [
  {
    slug: "itinerary-planner",
    eyebrow: "Itinerary Planner",
    title: "Build a clear travel itinerary without juggling notes and map tabs",
    description:
      "Plan a trip itinerary with dated stops, stays, map context, and a readable travel timeline.",
    intro:
      "Roamer's Ledger gives you one itinerary view that stays readable as the trip grows. Add stops, revisit places on different days, keep unscheduled ideas nearby, and switch between list and map without losing the day sequence.",
    mediaType: "video",
    mediaSrc: "/material/Recording_1.mp4",
    mediaAlt: "Itinerary planner recording",
    bullets: [
      "Keep dated and unscheduled stops in one planner.",
      "Switch between map view and list view without losing context.",
      "Share a readable trip schedule instead of scattered notes.",
    ],
  },
  {
    slug: "route-planner",
    eyebrow: "Route Planner",
    title: "Plan routes between stops while keeping the day sequence visible",
    description:
      "Use a trip route planner that keeps stops, transport, and the itinerary timeline connected.",
    intro:
      "The route view is built around the trip, not around isolated point-to-point searches. You can see how movement fits inside each day, compare route modes, and keep transport decisions attached to the plan that people will actually follow.",
    mediaType: "image",
    mediaSrc: "/material/Compass.png",
    mediaAlt: "Compass illustration",
    bullets: [
      "Calculate movement between itinerary stops inside the same planner.",
      "Keep transport and stay details in context with the route.",
      "Use the trip map as a working route surface, not just a reference map.",
    ],
  },
  {
    slug: "group-trip-planning",
    eyebrow: "Group Planning",
    title: "Plan together and keep everyone on the same page",
    description:
      "Collaborate on group trip plans with one shared itinerary, map, and trip schedule.",
    intro:
      "Roamer's Ledger is designed for shared planning. Invite collaborators, keep one version of the itinerary, and make the trip understandable for everyone without splitting updates across group chats and screenshots.",
    mediaType: "video",
    mediaSrc: "/material/Recording_2.mp4",
    mediaAlt: "Group trip planning recording",
    bullets: [
      "Share the same trip instead of maintaining multiple copies.",
      "Keep transport, stays, and the route in one shared workspace.",
      "Make the final plan easier for everyone to follow.",
    ],
  },
  {
    slug: "travel-expense-tracker",
    eyebrow: "Expense Tracking",
    title: "Track travel expenses without losing the trip context",
    description:
      "Track shared and personal travel expenses inside the same trip workspace.",
    intro:
      "Expenses make more sense when they live next to the itinerary. Keep personal and shared costs tied to the same trip, so transport, accommodation, and group spending stay connected to the actual plan.",
    mediaType: "video",
    mediaSrc: "/material/Recording_3.mp4",
    mediaAlt: "Travel expense tracking recording",
    bullets: [
      "Separate personal and shared spending clearly.",
      "Keep expense tracking inside the trip instead of another spreadsheet.",
      "Review costs alongside the route, stays, and day plan.",
    ],
  },
  {
    slug: "trip-pdf-export",
    eyebrow: "Trip PDF",
    title: "Save your itinerary as a clean trip PDF for offline reference",
    description:
      "Export a phone-friendly trip itinerary PDF with stops, routes, and map links.",
    intro:
      "When you need a stable copy of the plan, export the itinerary as a compact PDF. The printable trip view keeps stops, route summaries, stays, and map links in one shareable offline-friendly document.",
    mediaType: "image",
    mediaSrc: "/material/Scroll.png",
    mediaAlt: "Scroll illustration",
    bullets: [
      "Generate a narrow itinerary PDF that reads well on a phone.",
      "Keep route summaries and map links in the exported plan.",
      "Share a stable read-only version of the trip when needed.",
    ],
  },
];

export function getMarketingFeaturePage(slug: string) {
  return marketingFeaturePages.find((page) => page.slug === slug) ?? null;
}

export function getMarketingFeatureMetadata(
  page: MarketingFeaturePage,
): Metadata {
  return {
    title: page.eyebrow,
    description: page.description,
    alternates: {
      canonical: buildAbsoluteUrl(`/features/${page.slug}`),
    },
    openGraph: {
      title: `${page.eyebrow} | ${SITE_NAME}`,
      description: page.description,
      url: buildAbsoluteUrl(`/features/${page.slug}`),
      type: "article",
      images: page.mediaType === "image" ? [page.mediaSrc] : [BRAND_LOGO_SRC],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.eyebrow} | ${SITE_NAME}`,
      description: page.description,
      images: page.mediaType === "image" ? [page.mediaSrc] : [BRAND_LOGO_SRC],
    },
    keywords: [
      page.eyebrow.toLowerCase(),
      "travel planner",
      "trip planning app",
      SITE_DESCRIPTION,
    ],
  };
}
import { BRAND_LOGO_SRC } from "@/components/layout/brand-assets";


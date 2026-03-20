import type { Metadata } from "next";

export const SITE_NAME = "Roamer's Ledger";
export const SITE_TITLE = "Roamer's Ledger | Travel Planner";
export const SITE_DESCRIPTION =
  "Plan trips with a clear itinerary, interactive map, transport, stays, collaboration, and shared expense tracking in one travel planner.";

export function getSiteUrl() {
  const candidate =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";

  const withProtocol = candidate.startsWith("http")
    ? candidate
    : `https://${candidate}`;

  return new URL(withProtocol);
}

export function buildAbsoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export function createNoIndexMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}


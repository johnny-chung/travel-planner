import type { Metadata } from "next";
import HomeClient from "@/features/home/components/HomeClient";
import PublicLandingPage from "@/features/home/components/PublicLandingPage";
import { getSession } from "@/features/auth/session";
import { getNavigationSummary } from "@/features/navigation/service";
import { getRecentTripSummariesForUser } from "@/features/trips/service";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  buildAbsoluteUrl,
} from "@/features/seo/metadata";

export const metadata: Metadata = {
  title: "Travel Planner for Itinerary, Routes, Expenses, and Collaboration",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: buildAbsoluteUrl("/"),
  },
  openGraph: {
    title: "Roamer's Ledger | Travel Planner",
    description: SITE_DESCRIPTION,
    url: buildAbsoluteUrl("/"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roamer's Ledger | Travel Planner",
    description: SITE_DESCRIPTION,
  },
};

export default async function Home() {
  const session = await getSession();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: buildAbsoluteUrl("/"),
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "TravelApplication",
        operatingSystem: "Web",
        description: SITE_DESCRIPTION,
        url: buildAbsoluteUrl("/"),
      },
    ],
  };

  if (!session?.user?.id) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <PublicLandingPage />
      </>
    );
  }

  const [plans, navigation] = await Promise.all([
    getRecentTripSummariesForUser(session.user.id),
    getNavigationSummary(session.user.id),
  ]);

  return (
    <HomeClient
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
      }}
      plans={plans}
      membershipStatus={navigation.membershipStatus}
    />
  );
}

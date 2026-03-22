import type { Metadata } from "next";
import HomeClient from "@/features/home/components/HomeClient";
import PublicLandingPage from "@/features/home/components/PublicLandingPage";
import { getSession } from "@/features/auth/session";
import { getNavigationSummary } from "@/features/navigation/service";
import { getRecentTripSummariesForUser } from "@/features/trips/service";
import {
  SITE_NAME,
  buildAbsoluteUrl,
  buildLocaleAlternates,
} from "@/features/seo/metadata";
import { localizeHref, type AppLocale } from "@/features/i18n/config";
import { getDictionary } from "@/features/i18n/dictionaries";

type Props = {
  params: Promise<{ lang: AppLocale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  const localizedPath = localizeHref(lang, "/");
  const title = dictionary.landing.heroSubtitle;
  const description = dictionary.landing.heroBody;

  return {
    title,
    description,
    alternates: buildLocaleAlternates(lang, "/"),
    openGraph: {
      title: `${SITE_NAME} | ${title}`,
      description,
      url: buildAbsoluteUrl(localizedPath),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} | ${title}`,
      description,
    },
  };
}

export default async function Home({ params }: Props) {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  const session = await getSession();
  const localizedPath = localizeHref(lang, "/");
  const localizedDescription = dictionary.landing.heroBody;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: buildAbsoluteUrl(localizedPath),
        description: localizedDescription,
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: buildAbsoluteUrl(localizedPath),
        logo: buildAbsoluteUrl("/material/Logo-20260321.png"),
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "TravelApplication",
        operatingSystem: "Web",
        description: localizedDescription,
        url: buildAbsoluteUrl(localizedPath),
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

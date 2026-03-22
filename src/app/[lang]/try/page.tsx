import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import TripsPageClient from "@/features/trips/components/TripsPageClient";
import { getGuestId } from "@/features/guest/session";
import { getTrialTripSummariesForGuest } from "@/features/trips/service";
import { getDictionary } from "@/features/i18n/dictionaries";
import { localizeHref, type AppLocale } from "@/features/i18n/config";
import {
  SITE_NAME,
  buildAbsoluteUrl,
  buildLocaleAlternates,
} from "@/features/seo/metadata";

type Props = {
  params: Promise<{ lang: AppLocale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  const title = dictionary.tripsPage.trialTitle;
  const description = dictionary.landing.heroBody;
  const localizedPath = localizeHref(lang, "/try");

  return {
    title,
    description,
    alternates: buildLocaleAlternates(lang, "/try"),
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: buildAbsoluteUrl(localizedPath),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function TryPage({ params }: Props) {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  const session = await auth();
  if (session?.user?.id) {
    redirect(localizeHref(lang, "/trips"));
  }

  const guestId = await getGuestId();
  const trips = guestId ? await getTrialTripSummariesForGuest(guestId) : [];

  return (
    <TripsPageClient
      initialTrips={trips}
      currentView="active"
      activeTripCount={trips.length}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      pageTitle={dictionary.tripsPage.trialTitle}
      showCreate={trips.length === 0}
      collectionPath="/try"
      cardTarget="trial"
      createMode="guest"
      canShareCode={false}
      allowJoin={false}
      createDialogTitle={dictionary.tripsPage.trialCreateTitle}
      autoOpenCreate={trips.length === 0}
      showFilters={false}
    />
  );
}

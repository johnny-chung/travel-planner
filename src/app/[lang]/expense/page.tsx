import { requireUserId } from "@/features/auth/session";
import { getTripSummariesForUser } from "@/features/trips/service";
import TripsPageClient from "@/features/trips/components/TripsPageClient";
import { getDictionary } from "@/features/i18n/dictionaries";
import type { AppLocale } from "@/features/i18n/config";

type Props = {
  searchParams: Promise<{ view?: string }>;
  params: Promise<{ lang: AppLocale }>;
};

export default async function ExpensePage({ searchParams, params }: Props) {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  const userId = await requireUserId();
  const [{ view }, allTrips] = await Promise.all([
    searchParams,
    getTripSummariesForUser(userId),
  ]);
  const currentView = view === "all" ? "all" : "active";
  const trips =
    currentView === "all"
      ? allTrips
      : allTrips.filter((trip) => trip.status !== "archived");
  const activeTripCount = allTrips.filter((trip) => trip.status !== "archived").length;

  return (
    <TripsPageClient
      initialTrips={trips}
      currentView={currentView}
      activeTripCount={activeTripCount}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      pageTitle={dictionary.tripsPage.expenses}
      showCreate={false}
      collectionPath="/expense"
      cardTarget="expense"
      decorationImage="/material/Bag.png"
    />
  );
}

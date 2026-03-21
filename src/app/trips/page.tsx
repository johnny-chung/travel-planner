import { requireUserId } from "@/features/auth/session";
import { getTripSummariesForUser } from "@/features/trips/service";
import TripsPageClient from "@/features/trips/components/TripsPageClient";

type Props = {
  searchParams: Promise<{ view?: string }>;
};

export default async function TripsPage({ searchParams }: Props) {
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
      decorationImage="/material/Compass_Map.png"
    />
  );
}

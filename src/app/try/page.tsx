import { redirect } from "next/navigation";
import { auth } from "@/auth";
import TripsPageClient from "@/features/trips/components/TripsPageClient";
import { getGuestId } from "@/features/guest/session";
import { getTrialTripSummariesForGuest } from "@/features/trips/service";

export default async function TryPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/trips");
  }

  const guestId = await getGuestId();
  const trips = guestId ? await getTrialTripSummariesForGuest(guestId) : [];

  return (
    <TripsPageClient
      initialTrips={trips}
      currentView="active"
      activeTripCount={trips.length}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      pageTitle="Try Roamer's Ledger"
      showCreate={trips.length === 0}
      collectionPath="/try"
      cardTarget="trial"
      createMode="guest"
      canShareCode={false}
      allowJoin={false}
      createDialogTitle="Start Your Trial Trip"
      autoOpenCreate={trips.length === 0}
      showFilters={false}
    />
  );
}

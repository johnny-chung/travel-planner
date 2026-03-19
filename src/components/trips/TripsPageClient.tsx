"use client";
import TripListClient, { type Trip } from "./TripListClient";

type Props = {
  initialTrips: Trip[];
  googleMapsApiKey: string;
  currentView: "active" | "all";
  activeTripCount: number;
  pageTitle?: string;
  showCreate?: boolean;
  collectionPath?: "/trips" | "/plans" | "/expense";
  cardTarget?: "trip" | "plan" | "expense";
};

export default function TripsPageClient({
  initialTrips,
  googleMapsApiKey,
  currentView,
  activeTripCount,
  pageTitle = "My Trips",
  showCreate = true,
  collectionPath = "/trips",
  cardTarget = "trip",
}: Props) {
  return (
    <TripListClient
      initialTrips={initialTrips}
      googleMapsApiKey={googleMapsApiKey}
      pageTitle={pageTitle}
      showCreate={showCreate}
      currentView={currentView}
      activeTripCount={activeTripCount}
      collectionPath={collectionPath}
      cardTarget={cardTarget}
    />
  );
}

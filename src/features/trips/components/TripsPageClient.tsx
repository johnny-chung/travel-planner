"use client";
import TripListClient, { type Trip } from "./TripListClient";

type Props = {
  initialTrips: Trip[];
  googleMapsApiKey: string;
  currentView: "active" | "all";
  activeTripCount: number;
  pageTitle?: string;
  showCreate?: boolean;
  collectionPath?: "/trips" | "/plans" | "/expense" | "/try";
  cardTarget?: "trip" | "plan" | "expense" | "trial";
  createMode?: "user" | "guest";
  canShareCode?: boolean;
  allowJoin?: boolean;
  createDialogTitle?: string;
  autoOpenCreate?: boolean;
  showFilters?: boolean;
  decorationImage?: string;
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
  createMode = "user",
  canShareCode = true,
  allowJoin = true,
  createDialogTitle = "New Trip",
  autoOpenCreate = false,
  showFilters = true,
  decorationImage = "/material/Compass.png",
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
      createMode={createMode}
      canShareCode={canShareCode}
      allowJoin={allowJoin}
      createDialogTitle={createDialogTitle}
      autoOpenCreate={autoOpenCreate}
      showFilters={showFilters}
      decorationImage={decorationImage}
    />
  );
}

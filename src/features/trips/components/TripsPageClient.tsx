"use client";
import TripListClient, { type Trip } from "./TripListClient";
import { usePathname } from "next/navigation";
import { getClientDictionary } from "@/features/i18n/client";

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
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const resolvedPageTitle =
    pageTitle ??
    (collectionPath === "/plans"
      ? dictionary.tripsPage.plans
      : collectionPath === "/expense"
        ? dictionary.tripsPage.expenses
        : collectionPath === "/try"
          ? dictionary.tripsPage.trialTitle
          : dictionary.tripsPage.myTrips);
  const resolvedCreateDialogTitle =
    collectionPath === "/try"
      ? dictionary.tripsPage.trialCreateTitle
      : createDialogTitle === "New Trip"
        ? dictionary.tripsPage.newTrip
        : createDialogTitle;

  return (
    <TripListClient
      initialTrips={initialTrips}
      googleMapsApiKey={googleMapsApiKey}
      pageTitle={resolvedPageTitle}
      showCreate={showCreate}
      currentView={currentView}
      activeTripCount={activeTripCount}
      collectionPath={collectionPath}
      cardTarget={cardTarget}
      createMode={createMode}
      canShareCode={canShareCode}
      allowJoin={allowJoin}
      createDialogTitle={resolvedCreateDialogTitle}
      autoOpenCreate={autoOpenCreate}
      showFilters={showFilters}
      decorationImage={decorationImage}
    />
  );
}

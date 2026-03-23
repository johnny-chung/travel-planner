import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import PlanMapClient from "@/features/planner/components/PlanMapClient";
import PlannerFiltersForm from "@/features/planner/components/plan-map/PlannerFiltersForm";
import PlannerHeader from "@/features/planner/components/plan-map/PlannerHeader";
import PlannerListActions from "@/features/planner/components/plan-map/PlannerListActions";
import StopsList from "@/features/planner/components/stops/StopsList";
import {
  parsePlannerSearchParams,
} from "@/features/planner/search-params";
import {
  buildRouteSegments,
} from "@/features/planner/timeline";
import { buildPlannerShareText } from "@/features/planner/share";
import { getGeoapifyPlaceSuggestions } from "@/features/planner/geoapify";
import { getTripPlannerDataForGuest } from "@/features/planner/service";
import { getGuestId } from "@/features/guest/session";
import { localizeHref, type AppLocale } from "@/features/i18n/config";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ lang: AppLocale; tripId: string }>;
  searchParams: Promise<SearchParams>;
};

function parseFocusCoordinate(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function TrialPlanPage({ params, searchParams }: Props) {
  const session = await auth();
  const [{ lang, tripId }, rawSearchParams] = await Promise.all([params, searchParams]);

  if (session?.user?.id) {
    redirect(localizeHref(lang, `/trips/${tripId}/plan`));
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect(localizeHref(lang, "/try"));
  }

  const searchState = parsePlannerSearchParams(rawSearchParams);
  const plannerData = await getTripPlannerDataForGuest(
    tripId,
    guestId,
    searchState.from,
    searchState.to,
  );

  if (!plannerData) notFound();

  const pathname = localizeHref(lang, `/try/${tripId}/plan`);
  const routeSegments = buildRouteSegments(plannerData.timelineItems);
  const shareText = buildPlannerShareText(
    plannerData.plan.name,
    plannerData.timelineItems,
  );
  const defaultSuggestionCenter =
    plannerData.plan.centerLat !== null && plannerData.plan.centerLng !== null
      ? {
          lat: plannerData.plan.centerLat,
          lng: plannerData.plan.centerLng,
        }
      : null;
  const suggestLat = parseFocusCoordinate(searchState.suggestLat);
  const suggestLng = parseFocusCoordinate(searchState.suggestLng);
  const activeSuggestionCenter =
    suggestLat !== null && suggestLng !== null
      ? { lat: suggestLat, lng: suggestLng }
      : defaultSuggestionCenter;
  const suggestions =
    searchState.suggestLookup && activeSuggestionCenter
    ? await getGeoapifyPlaceSuggestions({
        lat: activeSuggestionCenter.lat,
        lng: activeSuggestionCenter.lng,
        category: searchState.suggestCategory,
      })
    : [];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background relative md:pt-16">
      <PlannerHeader
        pathname={pathname}
        planName={plannerData.plan.name}
        stopCount={plannerData.expandedStops.length + plannerData.unscheduledStops.length}
        searchState={searchState}
        isArchived={plannerData.isArchived}
        backHref={localizeHref(lang, `/try/${tripId}`)}
      />

      {searchState.filters ? (
        <PlannerFiltersForm
          pathname={pathname}
          searchState={searchState}
          tripDates={plannerData.travelDates}
        />
      ) : null}

      {searchState.view === "map" ? (
        <PlanMapClient
          plan={plannerData.plan}
          tripDates={plannerData.travelDates}
          stops={plannerData.orderedStops}
          unscheduledStops={plannerData.unscheduledStops}
          stays={plannerData.stayItems}
          suggestions={suggestions}
          suggestionCategory={searchState.suggestCategory}
          defaultSuggestionCenter={defaultSuggestionCenter}
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
          pathname={pathname}
          searchState={searchState}
          isArchived={plannerData.isArchived}
          tripDocs={plannerData.tripDocs}
          accessMode="guest"
        />
      ) : (
        <div className="flex-1 overflow-hidden">
          <StopsList
            pathname={pathname}
            tripId={tripId}
            searchState={searchState}
            timelineItems={plannerData.timelineItems}
            tripDates={plannerData.travelDates}
            unscheduledStops={plannerData.unscheduledStops}
            travelTimes={plannerData.travelTimes}
            accessMode="guest"
          />
          <PlannerListActions
            pathname={pathname}
            tripId={tripId}
            planName={plannerData.plan.name}
            tripDates={plannerData.travelDates}
            shareText={shareText}
            searchState={searchState}
            isArchived={plannerData.isArchived}
            capabilities={plannerData.capabilities}
            canCalculate={routeSegments.length > 0}
            tripDocs={plannerData.tripDocs}
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
            accessMode="guest"
          />
        </div>
      )}

    </div>
  );
}

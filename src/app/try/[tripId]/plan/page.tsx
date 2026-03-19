import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import PlanMapClient from "@/components/map/PlanMapClient";
import PlannerFiltersForm from "@/components/map/plan-map/PlannerFiltersForm";
import PlannerHeader from "@/components/map/plan-map/PlannerHeader";
import PlannerListActions from "@/components/map/plan-map/PlannerListActions";
import StopDetailModal from "@/components/stops/StopDetailModal";
import StopsList from "@/components/stops/StopsList";
import {
  buildPlannerHref,
  parsePlannerSearchParams,
} from "@/features/planner/search-params";
import {
  buildRouteSegments,
} from "@/features/planner/timeline";
import { buildPlannerShareText } from "@/features/planner/share";
import { getTripPlannerDataForGuest } from "@/features/planner/service";
import { getGuestId } from "@/features/guest/session";
import type { Stop } from "@/components/map/plan-map/types";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<SearchParams>;
};

function isSameStop(left: Stop, right: Stop) {
  return (
    left._id === right._id &&
    (left._arrivalIndex ?? 0) === (right._arrivalIndex ?? 0)
  );
}

function findStopBySelection(stops: Stop[], stopId: string, arrivalIndex: number) {
  return (
    stops.find(
      (stop) =>
        stop._id === stopId && (stop._arrivalIndex ?? 0) === arrivalIndex,
    ) ??
    stops.find((stop) => stop._id === stopId) ??
    null
  );
}

export default async function TrialPlanPage({ params, searchParams }: Props) {
  const session = await auth();
  const [{ tripId }, rawSearchParams] = await Promise.all([params, searchParams]);

  if (session?.user?.id) {
    redirect(`/trips/${tripId}/plan`);
  }

  const guestId = await getGuestId();
  if (!guestId) {
    redirect("/try");
  }

  const searchState = parsePlannerSearchParams(rawSearchParams);
  const plannerData = await getTripPlannerDataForGuest(
    tripId,
    guestId,
    searchState.from,
    searchState.to,
  );

  if (!plannerData) notFound();

  const pathname = `/try/${tripId}/plan`;
  const routeSegments = buildRouteSegments(plannerData.timelineItems);
  const shareText = buildPlannerShareText(
    plannerData.plan.name,
    plannerData.timelineItems,
  );
  const closeHref = buildPlannerHref(pathname, searchState, {
    stopId: null,
    stayId: null,
    arrivalIndex: 0,
    edit: false,
    travelFrom: null,
    travelTo: null,
  });

  const visibleStops = [...plannerData.expandedStops, ...plannerData.unscheduledStops];
  const selectedFromVisible = searchState.stopId
    ? findStopBySelection(
        visibleStops,
        searchState.stopId,
        searchState.arrivalIndex,
      )
    : null;
  const selectedStop =
    selectedFromVisible ??
    (searchState.stopId
      ? findStopBySelection(
          [...plannerData.allExpandedStops, ...plannerData.unscheduledStops],
          searchState.stopId,
          searchState.arrivalIndex,
        )
      : null);

  const stopSequence =
    selectedStop && selectedFromVisible
      ? visibleStops
      : plannerData.allExpandedStops;
  const selectedIndex = selectedStop
    ? stopSequence.findIndex((stop) => isSameStop(stop, selectedStop))
    : -1;
  const previousStop = selectedIndex > 0 ? stopSequence[selectedIndex - 1] : null;
  const nextStop =
    selectedIndex >= 0 && selectedIndex < stopSequence.length - 1
      ? stopSequence[selectedIndex + 1]
      : null;

  const selectedViewHref = selectedStop
    ? buildPlannerHref(pathname, searchState, {
        stopId: selectedStop._id,
        arrivalIndex: selectedStop._arrivalIndex ?? 0,
        edit: false,
        travelFrom: null,
        travelTo: null,
      })
    : closeHref;
  const selectedEditHref = selectedStop
    ? buildPlannerHref(pathname, searchState, {
        stopId: selectedStop._id,
        arrivalIndex: selectedStop._arrivalIndex ?? 0,
        edit: true,
        travelFrom: null,
        travelTo: null,
      })
    : closeHref;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background relative md:pt-16">
      <PlannerHeader
        pathname={pathname}
        planName={plannerData.plan.name}
        stopCount={plannerData.expandedStops.length + plannerData.unscheduledStops.length}
        searchState={searchState}
        isArchived={plannerData.isArchived}
        backHref={`/try/${tripId}`}
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
          stops={plannerData.orderedStops}
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
            unscheduledStops={plannerData.unscheduledStops}
            travelTimes={plannerData.travelTimes}
            accessMode="guest"
          />
          <PlannerListActions
            pathname={pathname}
            tripId={tripId}
            planName={plannerData.plan.name}
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

      {selectedStop ? (
        <StopDetailModal
          key={`${selectedStop._id}-${selectedStop._arrivalIndex ?? 0}-${searchState.edit && selectedStop.editable !== false ? "edit" : "view"}`}
          tripId={tripId}
          stop={selectedStop}
          isEdit={searchState.edit && selectedStop.editable !== false}
          tripDocs={plannerData.tripDocs}
          closeHref={closeHref}
          viewHref={selectedViewHref}
          editHref={selectedEditHref}
          prevHref={
            previousStop
              ? buildPlannerHref(pathname, searchState, {
                  stopId: previousStop._id,
                  stayId: null,
                  arrivalIndex: previousStop._arrivalIndex ?? 0,
                  edit: false,
                  travelFrom: null,
                  travelTo: null,
                })
              : null
          }
          nextHref={
            nextStop
              ? buildPlannerHref(pathname, searchState, {
                  stopId: nextStop._id,
                  stayId: null,
                  arrivalIndex: nextStop._arrivalIndex ?? 0,
                  edit: false,
                  travelFrom: null,
                  travelTo: null,
                })
              : null
          }
          deleteReturnTo={closeHref}
          accessMode="guest"
          canVisitAgain={false}
        />
      ) : null}
    </div>
  );
}

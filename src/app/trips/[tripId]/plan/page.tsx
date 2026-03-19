import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import PlanMapClient from "@/components/map/PlanMapClient";
import PlannerFiltersForm from "@/components/map/plan-map/PlannerFiltersForm";
import PlannerHeader from "@/components/map/plan-map/PlannerHeader";
import PlannerListActions from "@/components/map/plan-map/PlannerListActions";
import StayDetailModal from "@/components/stays/StayDetailModal";
import StopDetailModal from "@/components/stops/StopDetailModal";
import StopsList from "@/components/stops/StopsList";
import ModeEditSheet from "@/components/stops/ModeEditSheet";
import {
  buildPlannerHref,
  parsePlannerSearchParams,
} from "@/features/planner/search-params";
import {
  buildRouteNodes,
  buildRouteSegments,
} from "@/features/planner/timeline";
import { buildPlannerShareText } from "@/features/planner/share";
import { getTripPlannerDataForUser } from "@/features/planner/service";
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

export default async function TripPlanPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [{ tripId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const searchState = parsePlannerSearchParams(rawSearchParams);
  const plannerData = await getTripPlannerDataForUser(
    tripId,
    session.user.id,
    searchState.from,
    searchState.to,
  );

  if (!plannerData) notFound();

  const pathname = `/trips/${tripId}/plan`;
  const routeNodes = buildRouteNodes(plannerData.timelineItems);
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

  const selectedFromVisible = searchState.stopId
    ? findStopBySelection(
        plannerData.expandedStops,
        searchState.stopId,
        searchState.arrivalIndex,
      )
    : null;
  const selectedStop =
    selectedFromVisible ??
    (searchState.stopId
      ? findStopBySelection(
          plannerData.allExpandedStops,
          searchState.stopId,
          searchState.arrivalIndex,
        )
      : null);
  const selectedStay = searchState.stayId
    ? plannerData.stayItems.find((stay) => stay._id === searchState.stayId) ?? null
    : null;

  const stopSequence =
    selectedStop && selectedFromVisible
      ? plannerData.expandedStops
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

  const travelCloseHref = buildPlannerHref(pathname, searchState, {
    travelFrom: null,
    travelTo: null,
  });
  const fromTravelNode = searchState.travelFrom
    ? routeNodes.find((node) => node.id === searchState.travelFrom) ?? null
    : null;
  const toTravelNode = searchState.travelTo
    ? routeNodes.find((node) => node.id === searchState.travelTo) ?? null
    : null;
  const currentTravelTime =
    fromTravelNode && toTravelNode
      ? plannerData.travelTimes.find(
          (travelTime) =>
            travelTime.fromStopId === fromTravelNode.id &&
            travelTime.toStopId === toTravelNode.id,
        ) ?? null
      : null;
  const travelCurrentHref =
    fromTravelNode && toTravelNode
      ? buildPlannerHref(pathname, searchState, {
          stopId: null,
          arrivalIndex: 0,
          edit: false,
          travelFrom: fromTravelNode.id,
          travelTo: toTravelNode.id,
        })
      : travelCloseHref;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background relative md:pt-16">
      <PlannerHeader
        pathname={pathname}
        planName={plannerData.plan.name}
        stopCount={plannerData.expandedStops.length}
        searchState={searchState}
        isArchived={plannerData.isArchived}
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
        />
      ) : (
        <div className="flex-1 overflow-hidden">
          <StopsList
            pathname={pathname}
            searchState={searchState}
            timelineItems={plannerData.timelineItems}
            travelTimes={plannerData.travelTimes}
          />
          <PlannerListActions
            pathname={pathname}
            tripId={tripId}
            planName={plannerData.plan.name}
            shareText={shareText}
            searchState={searchState}
            isArchived={plannerData.isArchived}
            canCalculate={routeSegments.length > 0}
            tripDocs={plannerData.tripDocs}
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
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
        />
      ) : null}

      {selectedStay ? (
        <StayDetailModal stay={selectedStay} closeHref={closeHref} />
      ) : null}

      {fromTravelNode && toTravelNode ? (
        <ModeEditSheet
          key={`${fromTravelNode.id}-${toTravelNode.id}-${currentTravelTime?.mode ?? "TRANSIT"}`}
          tripId={tripId}
          fromNode={fromTravelNode}
          toNode={toTravelNode}
          currentMode={currentTravelTime?.mode ?? "TRANSIT"}
          currentTravelTime={currentTravelTime}
          currentHref={travelCurrentHref}
          closeHref={travelCloseHref}
        />
      ) : null}
    </div>
  );
}

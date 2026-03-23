"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AddStopModal from "@/features/planner/components/stops/AddStopModal";
import MapSearchBox from "@/features/planner/components/MapSearchBox";
import PoiInfoCard from "@/features/planner/components/plan-map/PoiInfoCard";
import {
  PlannerStopsSidebarDesktopPanel,
  PlannerStopsSidebarDesktopToggle,
  PlannerStopsSidebarMobile,
} from "@/features/planner/components/plan-map/PlannerStopsSidebar";
import { MARKER_STYLE_ID } from "@/features/planner/components/plan-map/constants";
import type {
  PendingLocation,
  PlanMapProps,
} from "@/features/planner/components/plan-map/types";
import {
  createMarkerElement,
  createSuggestionMarkerElement,
  createStayMarkerElement,
  createUnscheduledMarkerElement,
  getDateColorMap,
  getDefaultMapCenter,
} from "@/features/planner/components/plan-map/utils";
import { buildPlannerHref } from "@/features/planner/search-params";
import {
  buildPlannerBaseHref,
  buildPlannerStayModalHref,
  buildPlannerStopModalHref,
} from "@/features/planner/route-hrefs";
import { getClientDictionary, getClientLocale } from "@/features/i18n/client";
import { loadGoogleLibrary } from "@/lib/google-maps-loader";

export default function PlanMapClient({
  plan,
  tripDates = [],
  stops,
  unscheduledStops,
  stays,
  suggestions = [],
  suggestionCategory = "tourism",
  defaultSuggestionCenter = null,
  googleMapsApiKey,
  pathname,
  searchState,
  isArchived = false,
  tripDocs = [],
  accessMode = "user",
}: PlanMapProps) {
  const router = useRouter();
  const dictionary = getClientDictionary(pathname);
  const locale = getClientLocale(pathname);
  const googleMapsLoadErrorMessage = dictionary.planner.googleMapsLoadError;
  const suggestionMarkerLabel = dictionary.planner.suggestionMarker;
  const unscheduledMarkerLabel = dictionary.planner.saveForLaterStatus;
  const stayMarkerLabel = dictionary.planner.stays;
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const searchStateRef = useRef(searchState);
  const userFocusedMapRef = useRef(false);
  const initializedRef = useRef(false);
  const markersRef = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement>
  >(new Map());
  const isArchivedRef = useRef(isArchived);
  const [pendingLocation, setPendingLocation] =
    useState<PendingLocation | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [poiInfo, setPoiInfo] = useState<PendingLocation | null>(null);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  function parseCoordinatePoint(latValue?: string, lngValue?: string) {
    if (!latValue?.trim() || !lngValue?.trim()) {
      return null;
    }

    const lat = Number(latValue);
    const lng = Number(lngValue);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  const focusPoint = useMemo(() => {
    return parseCoordinatePoint(searchState.focusLat, searchState.focusLng);
  }, [searchState.focusLat, searchState.focusLng]);
  const suggestionMarkerPoint = useMemo(() => {
    return parseCoordinatePoint(
      searchState.suggestionMarkerLat,
      searchState.suggestionMarkerLng,
    );
  }, [searchState.suggestionMarkerLat, searchState.suggestionMarkerLng]);

  const groupedStopMarkers = useMemo(() => {
    const groups = new Map<
      string,
      { representative: (typeof stops)[number]; visits: typeof stops; isMultiVisit: boolean }
    >();

    for (const stop of stops) {
      const groupKey = stop.placeId || `stop:${stop._id}`;
      const current = groups.get(groupKey);
      if (!current) {
        groups.set(groupKey, {
          representative: stop,
          visits: [stop],
          isMultiVisit: false,
        });
        continue;
      }

      current.visits.push(stop);
      current.isMultiVisit = current.visits.length > 1;
      current.representative = current.visits.reduce((best, candidate) =>
        candidate.order < best.order ? candidate : best,
      );
    }

    return [...groups.values()];
  }, [stops]);

  useEffect(() => {
    isArchivedRef.current = isArchived;
  }, [isArchived]);

  useEffect(() => {
    searchStateRef.current = searchState;
  }, [searchState]);

  const returnTo = useMemo(
    () =>
      buildPlannerBaseHref(pathname, searchState, {
        travelFrom: null,
        travelTo: null,
      }),
    [pathname, searchState],
  );

  const setFocusHref = useCallback(
    (lat: number, lng: number, options?: { keepSuggestions?: boolean }) =>
      buildPlannerHref(pathname, searchState, {
        suggestLookup:
          options?.keepSuggestions ?? true ? searchState.suggestLookup : false,
        focusLat: String(lat),
        focusLng: String(lng),
        suggestionMarkerLat: null,
        suggestionMarkerLng: null,
        suggestLat:
          (options?.keepSuggestions ?? true) && searchState.suggestLat
            ? searchState.suggestLat
            : options?.keepSuggestions ?? true
              ? searchState.suggestLat || null
              : null,
        suggestLng:
          (options?.keepSuggestions ?? true) && searchState.suggestLng
            ? searchState.suggestLng
            : options?.keepSuggestions ?? true
              ? searchState.suggestLng || null
              : null,
      }),
    [pathname, searchState],
  );

  const openStopHref = useCallback(
    (stopId: string, lat?: number, lng?: number) => {
      const current = searchStateRef.current;
      return buildPlannerStopModalHref(
        pathname,
        {
          ...current,
          focusLat: current.view === "map" && typeof lat === "number" && typeof lng === "number"
            ? String(lat)
            : "",
          focusLng: current.view === "map" && typeof lat === "number" && typeof lng === "number"
            ? String(lng)
            : "",
          suggestionMarkerLat: "",
          suggestionMarkerLng: "",
          travelFrom: "",
          travelTo: "",
          stopId: "",
          stayId: "",
          edit: false,
        },
        stopId,
      );
    },
    [pathname],
  );

  const openStayHref = useCallback(
    (stayId: string, lat?: number, lng?: number) => {
      const current = searchStateRef.current;
      return buildPlannerStayModalHref(pathname, {
        ...current,
        focusLat: current.view === "map" && typeof lat === "number" && typeof lng === "number"
          ? String(lat)
          : "",
        focusLng: current.view === "map" && typeof lat === "number" && typeof lng === "number"
          ? String(lng)
          : "",
        suggestionMarkerLat: "",
        suggestionMarkerLng: "",
        travelFrom: "",
        travelTo: "",
        stopId: "",
        stayId: "",
        edit: false,
      }, stayId);
    },
    [pathname],
  );

  function handleMapType(type: "roadmap" | "hybrid") {
    setMapType(type);
    googleMapRef.current?.setMapTypeId(type);
  }

  useEffect(() => {
    if (!mapRef.current || !googleMapsApiKey || initializedRef.current) return;
    initializedRef.current = true;

    if (!document.getElementById(MARKER_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = MARKER_STYLE_ID;
      style.textContent =
        ".waypoint-marker:hover { transform: translateY(-6px) !important; }";
      document.head.appendChild(style);
    }

    const init = async () => {
      try {
        const [{ Map }] = await Promise.all([
          loadGoogleLibrary<google.maps.MapsLibrary>(googleMapsApiKey, "maps"),
          loadGoogleLibrary<google.maps.MarkerLibrary>(googleMapsApiKey, "marker"),
        ]);
        await loadGoogleLibrary<google.maps.PlacesLibrary>(
          googleMapsApiKey,
          "places",
        );

        if (!mapRef.current) return;

        const map = new Map(mapRef.current, {
          center: getDefaultMapCenter(plan, stops),
          zoom: plan.centerLat || stops.length > 0 ? 13 : 12,
          mapId: "travel-planner-map",
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });
        googleMapRef.current = map;
        setMapInstance(map);

        map.addListener("click", async (event: google.maps.MapMouseEvent) => {
          if (isArchivedRef.current) return;

          const iconEvent = event as google.maps.IconMouseEvent;
          if (iconEvent.placeId) {
            event.stop();
            try {
              const { Place } = await loadGoogleLibrary<google.maps.PlacesLibrary>(
                googleMapsApiKey,
                "places",
              );
              const place = new Place({ id: iconEvent.placeId });
              await place.fetchFields({
                fields: [
                  "displayName",
                  "formattedAddress",
                  "location",
                  "id",
                  "regularOpeningHours",
                  "nationalPhoneNumber",
                  "websiteURI",
                  "photos",
                  "rating",
                  "userRatingCount",
                ],
              });
              if (!place.location) return;
              const lat = place.location.lat();
              const lng = place.location.lng();
              userFocusedMapRef.current = true;
              setPoiInfo({
                name: place.displayName ?? "",
                address: place.formattedAddress ?? "",
                placeId: place.id ?? iconEvent.placeId,
                lat,
                lng,
                openingHours:
                  place.regularOpeningHours?.weekdayDescriptions ?? [],
                phone: place.nationalPhoneNumber ?? "",
                website: place.websiteURI ?? "",
                thumbnail: place.photos?.[0]?.getURI({ maxWidth: 400 }) ?? "",
                photos:
                  place.photos?.map((photo) => ({
                    src: photo.getURI({ maxWidth: 1200 }),
                    attributions: (photo.authorAttributions ?? []).map(
                      (attribution) => ({
                        displayName: attribution.displayName ?? "Photo credit",
                        uri: attribution.uri ?? "",
                      }),
                    ),
                  })) ?? [],
                rating: place.rating ?? null,
                userRatingCount: place.userRatingCount ?? null,
              });
              router.replace(setFocusHref(lat, lng));
            } catch {
              // ignore POI detail failures
            }
            return;
          }

          const latLng = event.latLng;
          if (!latLng) return;
          const { Geocoder } = await loadGoogleLibrary<google.maps.GeocodingLibrary>(
            googleMapsApiKey,
            "geocoding",
          );
          const geocoder = new Geocoder();
          const result = await geocoder.geocode({ location: latLng });
          const address =
            result.results[0]?.formatted_address ?? "Unknown location";
          const placeId = result.results[0]?.place_id ?? "";
          const lat = latLng.lat();
          const lng = latLng.lng();
          userFocusedMapRef.current = true;
          setPendingLocation({
            name: address.split(",")[0],
            address,
            lat,
            lng,
            placeId,
            openingHours: [],
            phone: "",
            website: "",
            thumbnail: "",
            photos: [],
            rating: null,
            userRatingCount: null,
          });
          router.replace(setFocusHref(lat, lng));
        });

        setMapLoaded(true);
      } catch (error) {
        console.error("Map init error:", error);
        toast.error(googleMapsLoadErrorMessage);
      }
    };

    void init();
  }, [googleMapsApiKey, googleMapsLoadErrorMessage, plan, router, setFocusHref, stops]);

  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    if (!focusPoint) {
      return;
    }

    userFocusedMapRef.current = true;
    googleMapRef.current.panTo(focusPoint);
  }, [focusPoint, mapLoaded]);

  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    const map = googleMapRef.current;
    let cancelled = false;

    const renderMarkers = async () => {
      const { AdvancedMarkerElement } =
        await loadGoogleLibrary<google.maps.MarkerLibrary>(
          googleMapsApiKey,
          "marker",
        );
      if (cancelled) return;

      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current.clear();

      const colorMap = getDateColorMap(stops);
      groupedStopMarkers.forEach(({ representative, isMultiVisit }) => {
        const color = colorMap.get(representative.date) ?? "#2f6e62";
        const markerElement = createMarkerElement(
          representative,
          isMultiVisit ? "M" : representative.order,
          color,
          locale,
        );
        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: representative.lat, lng: representative.lng },
          content: markerElement,
          title: representative.name,
        });

        markerElement.addEventListener("mouseenter", () => {
          marker.zIndex = 999;
        });
        markerElement.addEventListener("mouseleave", () => {
          marker.zIndex = null as unknown as number;
        });
        marker.addListener("gmp-click", () => {
          userFocusedMapRef.current = true;
          router.push(
            openStopHref(
              representative._id,
              representative.lat,
              representative.lng,
            ),
          );
        });
        markersRef.current.set(
          isMultiVisit && representative.placeId
            ? `place:${representative.placeId}`
            : representative._id,
          marker,
        );
      });

      if (!searchState.hideUnscheduledMap) {
        unscheduledStops.forEach((stop) => {
          const markerElement = createUnscheduledMarkerElement(
            stop,
            unscheduledMarkerLabel,
          );
          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: stop.lat, lng: stop.lng },
            content: markerElement,
            title: `${stop.name} (Unscheduled)`,
          });

          markerElement.addEventListener("mouseenter", () => {
            marker.zIndex = 999;
          });
          markerElement.addEventListener("mouseleave", () => {
            marker.zIndex = null as unknown as number;
          });
          marker.addListener("gmp-click", () => {
            userFocusedMapRef.current = true;
            router.push(openStopHref(stop._id, stop.lat, stop.lng));
          });
          markersRef.current.set(`unscheduled:${stop._id}`, marker);
        });
      }

      if (!searchState.hideStaysMap) {
        stays.forEach((stay) => {
          const markerElement = createStayMarkerElement(
            stay,
            locale,
            stayMarkerLabel,
          );
          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: stay.lat, lng: stay.lng },
            content: markerElement,
            title: `${stay.name} (Stay)`,
          });

          markerElement.addEventListener("mouseenter", () => {
            marker.zIndex = 999;
          });
          markerElement.addEventListener("mouseleave", () => {
            marker.zIndex = null as unknown as number;
          });
          marker.addListener("gmp-click", () => {
            userFocusedMapRef.current = true;
            router.push(openStayHref(stay._id, stay.lat, stay.lng));
          });
          markersRef.current.set(`stay:${stay._id}`, marker);
        });
      }

      if (suggestionMarkerPoint) {
        const selectedSuggestion =
          suggestions.find(
            (suggestion) =>
              Math.abs(suggestion.lat - suggestionMarkerPoint.lat) < 0.000001 &&
              Math.abs(suggestion.lng - suggestionMarkerPoint.lng) < 0.000001,
          ) ?? null;
        const markerElement = createSuggestionMarkerElement(
          selectedSuggestion?.name ?? suggestionMarkerLabel,
          suggestionMarkerLabel,
        );
        const marker = new AdvancedMarkerElement({
          map,
          position: suggestionMarkerPoint,
          content: markerElement,
          title: selectedSuggestion?.name ?? suggestionMarkerLabel,
        });
        markersRef.current.set("suggestion:active", marker);
      }

      if (
        !userFocusedMapRef.current &&
        (
          stops.length > 0 ||
          (!searchState.hideStaysMap && stays.length > 0) ||
          (!searchState.hideUnscheduledMap && unscheduledStops.length > 0)
        )
      ) {
        const bounds = new google.maps.LatLngBounds();
        groupedStopMarkers.forEach(({ representative }) =>
          bounds.extend({ lat: representative.lat, lng: representative.lng }),
        );
        if (!searchState.hideUnscheduledMap) {
          unscheduledStops.forEach((stop) =>
            bounds.extend({ lat: stop.lat, lng: stop.lng }),
          );
        }
        if (!searchState.hideStaysMap) {
          stays.forEach((stay) =>
            bounds.extend({ lat: stay.lat, lng: stay.lng }),
          );
        }
        map.fitBounds(bounds, 80);
      }
    };

    void renderMarkers();
    return () => {
      cancelled = true;
    };
  }, [
    googleMapsApiKey,
    mapLoaded,
    locale,
    openStayHref,
    openStopHref,
    router,
    searchState.hideStaysMap,
    searchState.hideUnscheduledMap,
    stayMarkerLabel,
    suggestionMarkerPoint,
    suggestionMarkerLabel,
    suggestions,
    stays,
    stops,
    unscheduledMarkerLabel,
    unscheduledStops,
    groupedStopMarkers,
  ]);

  const handleSearchSelect = useCallback(
    (info: PendingLocation) => {
      const map = googleMapRef.current;
      if (map) {
        userFocusedMapRef.current = true;
      map.panTo({ lat: info.lat, lng: info.lng });
      map.setZoom(16);
      }
      router.replace(setFocusHref(info.lat, info.lng));

      if (info.placeId) {
        const existingStop = stops.find((stop) => stop.placeId === info.placeId);
        if (existingStop) {
          router.push(openStopHref(existingStop._id, info.lat, info.lng));
          return;
        }

        const existingStay = stays.find((stay) => stay.placeId === info.placeId);
        if (existingStay) {
          router.push(openStayHref(existingStay._id, info.lat, info.lng));
          return;
        }
      }

      setPendingLocation(info);
    },
    [openStayHref, openStopHref, router, setFocusHref, stays, stops],
  );

  const handleSidebarStopSelect = useCallback((stop: (typeof stops)[number]) => {
    const map = googleMapRef.current;
    if (!map) {
      return;
    }

    userFocusedMapRef.current = true;
    map.panTo({ lat: stop.lat, lng: stop.lng });
    map.setZoom(Math.max(map.getZoom() ?? 13, 15));
    router.replace(setFocusHref(stop.lat, stop.lng, { keepSuggestions: true }));
  }, [router, setFocusHref]);

  const handleSidebarStaySelect = useCallback((stay: (typeof stays)[number]) => {
    const map = googleMapRef.current;
    if (!map) {
      return;
    }

    userFocusedMapRef.current = true;
    map.panTo({ lat: stay.lat, lng: stay.lng });
    map.setZoom(Math.max(map.getZoom() ?? 13, 15));
    router.replace(setFocusHref(stay.lat, stay.lng, { keepSuggestions: true }));
  }, [router, setFocusHref]);

  const handleSuggestionSelect = useCallback(
    (suggestion: { lat: number; lng: number }) => {
      const map = googleMapRef.current;
      if (!map) {
        return;
      }

      userFocusedMapRef.current = true;
      map.panTo({ lat: suggestion.lat, lng: suggestion.lng });
      map.setZoom(Math.max(map.getZoom() ?? 13, 15));
      router.replace(
        buildPlannerHref(pathname, searchStateRef.current, {
          suggestLookup: true,
          focusLat: String(suggestion.lat),
          focusLng: String(suggestion.lng),
          suggestionMarkerLat: String(suggestion.lat),
          suggestionMarkerLng: String(suggestion.lng),
        }),
      );
    },
    [pathname, router],
  );

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0 md:inset-x-4 md:inset-b-4 md:bottom-4 md:rounded-2xl overflow-hidden">
        {mapLoaded ? (
          <div className="absolute bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-10 flex rounded-full bg-card shadow-lg border border-border overflow-hidden text-xs font-semibold">
            {(
              [
                ["roadmap", dictionary.planner.mapLabel],
                ["hybrid", dictionary.planner.satelliteLabel],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                onClick={() => handleMapType(type)}
                className={`px-4 py-1.5 transition-colors ${
                  mapType === type
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div ref={mapRef} className="w-full h-full" />

        {!mapLoaded && googleMapsApiKey ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {dictionary.planner.loadingMap}
              </p>
            </div>
          </div>
        ) : null}

        {!googleMapsApiKey ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center p-6">
              <p className="text-foreground font-medium">
                {dictionary.planner.mapsApiMissingTitle}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {dictionary.planner.mapsApiMissingBody}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {mapLoaded ? (
        <>
          <div className="absolute left-3 right-3 top-3 z-20 md:left-7 md:right-7">
            <div className="flex items-start gap-2">
              <PlannerStopsSidebarDesktopToggle
                open={desktopSidebarOpen}
                onToggle={() => setDesktopSidebarOpen((value) => !value)}
              />
              <PlannerStopsSidebarMobile
                pathname={pathname}
                searchState={searchState}
                tripDates={tripDates}
                stops={stops}
                unscheduledStops={unscheduledStops}
                stays={stays}
                suggestions={suggestions}
                suggestionCategory={suggestionCategory}
                defaultSuggestionCenter={defaultSuggestionCenter}
                onStopSelect={handleSidebarStopSelect}
                onStaySelect={handleSidebarStaySelect}
                onSuggestionSelect={handleSuggestionSelect}
              />
              <MapSearchBox
                map={mapInstance}
                onSelect={handleSearchSelect}
                className="min-w-0 flex-1"
              />
            </div>
          </div>

          <div className="absolute inset-0 z-20 pointer-events-none md:inset-x-4 md:inset-b-4 md:bottom-4">
            <div className="pointer-events-auto">
              <PlannerStopsSidebarDesktopPanel
                pathname={pathname}
                searchState={searchState}
                tripDates={tripDates}
                stops={stops}
                unscheduledStops={unscheduledStops}
                stays={stays}
                suggestions={suggestions}
                suggestionCategory={suggestionCategory}
                defaultSuggestionCenter={defaultSuggestionCenter}
                open={desktopSidebarOpen}
                onStopSelect={handleSidebarStopSelect}
                onStaySelect={handleSidebarStaySelect}
                onSuggestionSelect={handleSuggestionSelect}
              />
            </div>
          </div>
        </>
      ) : null}

      {pendingLocation ? (
        <AddStopModal
          tripId={plan._id}
          location={pendingLocation}
          tripDates={tripDates}
          tripDocs={tripDocs}
          returnTo={returnTo}
          onCancel={() => setPendingLocation(null)}
          accessMode={accessMode}
        />
      ) : null}

      {poiInfo ? (
        <PoiInfoCard
          poiInfo={poiInfo}
          isArchived={isArchived}
          onAdd={() => {
            setPendingLocation(poiInfo);
            setPoiInfo(null);
          }}
          onClose={() => setPoiInfo(null)}
        />
      ) : null}
    </div>
  );
}

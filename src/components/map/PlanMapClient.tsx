"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AddStopModal from "@/components/stops/AddStopModal";
import MapSearchBox from "@/components/map/MapSearchBox";
import PoiInfoCard from "@/components/map/plan-map/PoiInfoCard";
import {
  PlannerStopsSidebarDesktopPanel,
  PlannerStopsSidebarDesktopToggle,
  PlannerStopsSidebarMobile,
} from "@/components/map/plan-map/PlannerStopsSidebar";
import { MARKER_STYLE_ID } from "@/components/map/plan-map/constants";
import type {
  PendingLocation,
  PlanMapProps,
} from "@/components/map/plan-map/types";
import {
  createMarkerElement,
  getDateColorMap,
  getDefaultMapCenter,
} from "@/components/map/plan-map/utils";
import { buildPlannerHref } from "@/features/planner/search-params";
import { loadGoogleLibrary } from "@/lib/google-maps-loader";

export default function PlanMapClient({
  plan,
  stops,
  googleMapsApiKey,
  pathname,
  searchState,
  isArchived = false,
  tripDocs = [],
  accessMode = "user",
}: PlanMapProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
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

  useEffect(() => {
    isArchivedRef.current = isArchived;
  }, [isArchived]);

  const returnTo = useMemo(
    () =>
      buildPlannerHref(pathname, searchState, {
        stopId: null,
        arrivalIndex: 0,
        edit: false,
        travelFrom: null,
        travelTo: null,
      }),
    [pathname, searchState],
  );

  const openStopHref = useCallback(
    (stopId: string) =>
      buildPlannerHref(pathname, searchState, {
        stopId,
        arrivalIndex: 0,
        edit: false,
        travelFrom: null,
        travelTo: null,
      }),
    [pathname, searchState],
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
              setPoiInfo({
                name: place.displayName ?? "",
                address: place.formattedAddress ?? "",
                placeId: place.id ?? iconEvent.placeId,
                lat: place.location.lat(),
                lng: place.location.lng(),
                openingHours:
                  place.regularOpeningHours?.weekdayDescriptions ?? [],
                phone: place.nationalPhoneNumber ?? "",
                website: place.websiteURI ?? "",
                thumbnail: place.photos?.[0]?.getURI({ maxWidth: 400 }) ?? "",
                rating: place.rating ?? null,
                userRatingCount: place.userRatingCount ?? null,
              });
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
          setPendingLocation({
            name: address.split(",")[0],
            address,
            lat: latLng.lat(),
            lng: latLng.lng(),
            placeId,
            openingHours: [],
            phone: "",
            website: "",
            thumbnail: "",
            rating: null,
            userRatingCount: null,
          });
        });

        setMapLoaded(true);
      } catch (error) {
        console.error("Map init error:", error);
        toast.error("Failed to load Google Maps. Check your API key.");
      }
    };

    void init();
  }, [googleMapsApiKey, plan, stops]);

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
      stops.forEach((stop) => {
        const color = colorMap.get(stop.date) ?? "#2563eb";
        const markerElement = createMarkerElement(stop, stop.order, color);
        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: stop.lat, lng: stop.lng },
          content: markerElement,
          title: stop.name,
        });

        markerElement.addEventListener("mouseenter", () => {
          marker.zIndex = 999;
        });
        markerElement.addEventListener("mouseleave", () => {
          marker.zIndex = null as unknown as number;
        });
        marker.addListener("gmp-click", () => {
          router.push(openStopHref(stop._id));
        });
        markersRef.current.set(stop._id, marker);
      });

      if (stops.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        stops.forEach((stop) =>
          bounds.extend({ lat: stop.lat, lng: stop.lng }),
        );
        map.fitBounds(bounds, 80);
      }
    };

    void renderMarkers();
    return () => {
      cancelled = true;
    };
  }, [googleMapsApiKey, mapLoaded, openStopHref, router, stops]);

  const handleSearchSelect = useCallback(
    (info: PendingLocation) => {
      const map = googleMapRef.current;
      if (map) {
        map.panTo({ lat: info.lat, lng: info.lng });
        map.setZoom(16);
      }

      if (info.placeId) {
        const existingStop = stops.find((stop) => stop.placeId === info.placeId);
        if (existingStop) {
          router.push(openStopHref(existingStop._id));
          return;
        }
      }

      setPendingLocation(info);
    },
    [openStopHref, router, stops],
  );

  const handleSidebarStopSelect = useCallback((stop: (typeof stops)[number]) => {
    const map = googleMapRef.current;
    if (!map) {
      return;
    }

    map.panTo({ lat: stop.lat, lng: stop.lng });
    map.setZoom(Math.max(map.getZoom() ?? 13, 15));
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0 md:inset-x-4 md:inset-b-4 md:bottom-4 md:rounded-2xl overflow-hidden">
        {mapLoaded ? (
          <div className="absolute bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-10 flex rounded-full bg-card shadow-lg border border-border overflow-hidden text-xs font-semibold">
            {(
              [
                ["roadmap", "Map"],
                ["hybrid", "Satellite"],
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
              <p className="text-muted-foreground text-sm">Loading map...</p>
            </div>
          </div>
        ) : null}

        {!googleMapsApiKey ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center p-6">
              <p className="text-foreground font-medium">
                Google Maps API key not configured
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
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
                stops={stops}
                onStopSelect={handleSidebarStopSelect}
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
                stops={stops}
                open={desktopSidebarOpen}
                onStopSelect={handleSidebarStopSelect}
              />
            </div>
          </div>
        </>
      ) : null}

      {pendingLocation ? (
        <AddStopModal
          tripId={plan._id}
          location={pendingLocation}
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

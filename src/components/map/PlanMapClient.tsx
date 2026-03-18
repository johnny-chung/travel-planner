"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { toast } from "sonner";
import {
  ArrowLeft,
  List,
  Map as MapIcon,
  SlidersHorizontal,
  ExternalLink,
  Plus,
  X,
  Archive,
  Route,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import AddStopModal from "@/components/stops/AddStopModal";
import StopDetailModal from "@/components/stops/StopDetailModal";
import StopsList from "@/components/stops/StopsList";
import ModeEditSheet from "@/components/stops/ModeEditSheet";
import MapSearchBox from "@/components/map/MapSearchBox";
import DateRangeFilter from "@/components/map/DateRangeFilter";

export type Stop = {
  _id: string;
  planId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  date: string;
  time: string;
  notes: string;
  openingHours: string[];
  phone: string;
  website: string;
  thumbnail: string;
  order: number;
  linkedDocIds: string[];
  arrivals?: { date: string; time: string }[];
  _arrivalIndex?: number;
};

export type TripDoc = { _id: string; name: string; url: string };

function expandStops(stops: Stop[]): Stop[] {
  const expanded: Stop[] = [];
  for (const stop of stops) {
    const arrivals = stop.arrivals && stop.arrivals.length > 0
      ? stop.arrivals
      : [{ date: stop.date, time: stop.time }];
    if (arrivals.length === 1) {
      expanded.push({ ...stop, _arrivalIndex: 0 });
    } else {
      for (let i = 0; i < arrivals.length; i++) {
        expanded.push({
          ...stop,
          date: arrivals[i].date,
          time: arrivals[i].time,
          _arrivalIndex: i,
        });
      }
    }
  }
  return expanded.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

export type PendingLocation = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  openingHours: string[];
  phone: string;
  website: string;
  thumbnail: string;
};

type Props = {
  plan: {
    _id: string;
    name: string;
    description: string;
    centerLat: number | null;
    centerLng: number | null;
    centerName: string;
    transportMode?: string;
  };
  initialStops: Stop[];
  googleMapsApiKey: string;
  isArchived?: boolean;
  tripDocs?: TripDoc[];
  tripTransportMode?: "transit" | "drive";
};

export default function PlanMapClient({
  plan,
  initialStops,
  googleMapsApiKey,
  isArchived = false,
  tripDocs = [],
  tripTransportMode,
}: Props) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement>
  >(new Map());
  const isArchivedRef = useRef(isArchived);
  isArchivedRef.current = isArchived;
  const [stops, setStops] = useState<Stop[]>(initialStops);
  const [view, setView] = useState<"map" | "list">("map");
  const [pendingLocation, setPendingLocation] =
    useState<PendingLocation | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [editStop, setEditStop] = useState<Stop | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");

  type TravelTimeEntry = {
    _id: string;
    fromStopId: string;
    toStopId: string;
    mode: "TRANSIT" | "DRIVE" | "WALK";
    durationMinutes: number;
  };
  const [travelTimes, setTravelTimes] = useState<TravelTimeEntry[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [showCalcConfirm, setShowCalcConfirm] = useState(false);
  const [editingTravelMode, setEditingTravelMode] = useState<{
    fromStop: Stop;
    toStop: Stop;
    currentMode: "TRANSIT" | "DRIVE" | "WALK";
  } | null>(null);

  void tripTransportMode;

  // 30 fixed colors for grouping pins by date
  const DATE_COLORS = [
    "#e53e3e",
    "#2b6cb0",
    "#6b46c1",
    "#0bc5ea",
    "#38a169",
    "#d53f8c",
    "#48bb78",
    "#ed8936",
    "#667eea",
    "#dd6b20",
    "#9f7aea",
    "#f687b3",
    "#4299e1",
    "#68d391",
    "#fc8181",
    "#f6ad55",
    "#76e4f7",
    "#b794f4",
    "#fbb6ce",
    "#90cdf4",
    "#c6f6d5",
    "#fefcbf",
    "#bee3f8",
    "#e9d8fd",
    "#fed7d7",
    "#feebc8",
    "#c6f6d5",
    "#e2e8f0",
    "#f093fb",
    "#d69e2e",
  ];

  function getDateColorMap(stopsArr: Stop[]): Map<string, string> {
    const uniqueDates = [...new Set(stopsArr.map((s) => s.date))].sort();
    const map = new Map<string, string>();
    uniqueDates.forEach((date, i) =>
      map.set(date, DATE_COLORS[i % DATE_COLORS.length]),
    );
    return map;
  }

  function handleMapType(type: "roadmap" | "hybrid") {
    setMapType(type);
    googleMapRef.current?.setMapTypeId(type);
  }

  type PoiInfo = {
    name: string;
    address: string;
    placeId: string;
    lat: number;
    lng: number;
    openingHours: string[];
    phone: string;
    website: string;
    thumbnail: string;
  };
  const [poiInfo, setPoiInfo] = useState<PoiInfo | null>(null);

  const filteredStops = stops.filter((s) => {
    if (!filterFrom && !filterTo) return true;
    const list = s.arrivals && s.arrivals.length > 0 ? s.arrivals : [{ date: s.date }];
    return list.some((a) => {
      if (filterFrom && a.date < filterFrom) return false;
      if (filterTo && a.date > filterTo) return false;
      return true;
    });
  });

  // For map markers: one entry per stop, sorted by primary date/time
  const orderedStops = [...filteredStops]
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    })
    .map((s, i) => ({ ...s, order: i + 1 }));

  // For list view and modal navigation: expand multi-arrival stops, filtering out arrivals outside range
  const expandedStops = expandStops(orderedStops)
    .filter((s) => {
      if (!filterFrom && !filterTo) return true;
      if (filterFrom && s.date < filterFrom) return false;
      if (filterTo && s.date > filterTo) return false;
      return true;
    })
    .map((s, i) => ({
      ...s,
      order: orderedStops.find((o) => o._id === s._id)?.order ?? i + 1,
    }));

  const createMarkerElement = useCallback(
    (stop: Stop, orderNum: number, pinColor: string) => {
      const truncName =
        stop.name.length > 20 ? stop.name.slice(0, 20) + "…" : stop.name;

      // Format "Jun 2" from "YYYY-MM-DD"
      const [, mo, dy] = stop.date.split("-").map(Number);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const dateLabel = `${months[mo - 1]} ${dy}`;

      // Format "12:05pm" from "HH:mm"
      const [hh, mm] = stop.time.split(":").map(Number);
      const period = hh >= 12 ? "pm" : "am";
      const h12 = hh % 12 || 12;
      const timeLabel = `${h12}:${mm.toString().padStart(2, "0")}${period}`;

      const el = document.createElement("div");
      el.innerHTML = `
      <div class="waypoint-marker" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.18s ease;">
        <div style="
          background:${pinColor};color:white;width:32px;height:32px;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);
          font-size:12px;font-weight:700;flex-shrink:0;">
          <span style="transform:rotate(45deg)">${stop.arrivals && stop.arrivals.length > 1 ? 'M' : orderNum}</span>
        </div>
        <div style="
          background:white;border-radius:8px;margin-top:5px;
          padding:3px 7px 4px;min-width:72px;max-width:110px;
          box-shadow:0 2px 8px rgba(0,0,0,0.18);text-align:center;
          border:1px solid rgba(0,0,0,0.08);">
          <div style="font-size:10px;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${truncName}</div>
          <div style="font-size:9px;color:${pinColor};font-weight:600;margin-top:1px;white-space:nowrap;">${dateLabel} · ${timeLabel}</div>
        </div>
      </div>`;
      return el;
    },
    [],
  );

  // Single init: setOptions once, then importLibrary for all needed libs
  useEffect(() => {
    if (!mapRef.current || !googleMapsApiKey) return;

    // Inject marker hover style once
    const styleId = "waypoint-marker-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `.waypoint-marker:hover { transform: translateY(-6px) !important; }`;
      document.head.appendChild(style);
    }

    const init = async () => {
      try {
        // setOptions must be called before the first importLibrary call
        setOptions({ key: googleMapsApiKey, v: "weekly" });

        // Load all required libraries up front
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
          importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
        ]);
        // Load places so Autocomplete is available for MapSearchBox
        await importLibrary("places");

        if (!mapRef.current) return;

        // Default to plan's saved center; fallback to first stop; then Tokyo
        const defaultCenter =
          plan.centerLat && plan.centerLng
            ? { lat: plan.centerLat, lng: plan.centerLng }
            : initialStops.length > 0
              ? { lat: initialStops[0].lat, lng: initialStops[0].lng }
              : { lat: 35.6762, lng: 139.6503 };

        const map = new Map(mapRef.current, {
          center: defaultCenter,
          zoom: plan.centerLat || initialStops.length > 0 ? 13 : 12,
          mapId: "travel-planner-map",
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });
        googleMapRef.current = map;

        // Handle clicks: POI (has placeId) vs blank map tap (geocode)
        map.addListener("click", async (e: google.maps.MapMouseEvent) => {
          if (isArchivedRef.current) return;
          const iconEvent = e as google.maps.IconMouseEvent;
          if (iconEvent.placeId) {
            e.stop(); // suppress Google's default info window
            try {
              const { Place } = (await google.maps.importLibrary(
                "places",
              )) as google.maps.PlacesLibrary;
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
              });
            } catch {
              /* place detail fetch failed */
            }
          } else {
            // Blank map tap — geocode the point
            const latLng = e.latLng;
            if (!latLng) return;
            const { Geocoder } = (await google.maps.importLibrary(
              "geocoding",
            )) as google.maps.GeocodingLibrary;
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
            });
          }
        });

        // Draw existing stops
        const initColorMap = getDateColorMap(initialStops);
        const initOrdered = [...initialStops].sort((a, b) =>
          a.date !== b.date
            ? a.date.localeCompare(b.date)
            : a.time.localeCompare(b.time),
        );
        initOrdered.forEach((stop, i) => {
          const color = initColorMap.get(stop.date) ?? "#2563eb";
          const el = createMarkerElement(stop, i + 1, color);
          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: stop.lat, lng: stop.lng },
            content: el,
            title: stop.name,
          });
          el.addEventListener("mouseenter", () => {
            marker.zIndex = 999;
          });
          el.addEventListener("mouseleave", () => {
            marker.zIndex = null as unknown as number;
          });
          marker.addListener("gmp-click", () =>
            setSelectedStop({ ...stop, order: i + 1 }),
          );
          markersRef.current.set(stop._id, marker);
        });

        if (initialStops.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          initialStops.forEach((s) =>
            bounds.extend({ lat: s.lat, lng: s.lng }),
          );
          map.fitBounds(bounds, 80);
        }

        setMapLoaded(true);
      } catch (err) {
        console.error("Map init error:", err);
        toast.error("Failed to load Google Maps. Check your API key.");
      }
    };

    init();
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when stops or filter changes
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;
    const map = googleMapRef.current;

    (async () => {
      const { AdvancedMarkerElement } = (await importLibrary(
        "marker",
      )) as google.maps.MarkerLibrary;
      markersRef.current.forEach((m) => {
        m.map = null;
      });
      markersRef.current.clear();
      const colorMap = getDateColorMap(orderedStops);
      orderedStops.forEach((stop) => {
        const color = colorMap.get(stop.date) ?? "#2563eb";
        const el = createMarkerElement(stop, stop.order, color);
        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: stop.lat, lng: stop.lng },
          content: el,
          title: stop.name,
        });
        el.addEventListener("mouseenter", () => {
          marker.zIndex = 999;
        });
        el.addEventListener("mouseleave", () => {
          marker.zIndex = null as unknown as number;
        });
        marker.addListener("gmp-click", () => setSelectedStop(stop));
        markersRef.current.set(stop._id, marker);
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, filterFrom, filterTo, mapLoaded]);

  // Fetch travel times on mount
  useEffect(() => {
    fetch(`/api/travel-time?planId=${plan._id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTravelTimes(data);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan._id]);

  const handleSearchSelect = useCallback((info: PendingLocation) => {
    const map = googleMapRef.current;
    if (map) {
      map.panTo({ lat: info.lat, lng: info.lng });
      map.setZoom(16);
    }
    // If this place already exists as a stop, show its detail instead
    if (info.placeId) {
      const existingStop = stops.find((s) => s.placeId === info.placeId);
      if (existingStop) {
        setSelectedStop(existingStop);
        return;
      }
    }
    setPendingLocation(info);
  }, [stops]);

  async function handleSaveStop(data: {
    date: string;
    time: string;
    notes: string;
    linkedDocIds: string[];
  }) {
    if (!pendingLocation) return;
    try {
      const res = await fetch(`/api/plans/${plan._id}/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pendingLocation,
          arrivals: [{ date: data.date, time: data.time }],
          notes: data.notes,
          linkedDocIds: data.linkedDocIds,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[handleSaveStop] API error:", res.status, body);
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const newStop: Stop = await res.json();
      const newStops = [...stops, { ...newStop, _id: String(newStop._id) }]
        .sort((a, b) =>
          a.date !== b.date
            ? a.date.localeCompare(b.date)
            : a.time.localeCompare(b.time),
        )
        .map((s, i) => ({ ...s, order: i + 1 }));
      setStops(newStops);
      setPendingLocation(null);
      toast.success(`${pendingLocation.name} added!`);
    } catch (err) {
      toast.error(
        `Failed to save stop: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async function handleUpdateStop(
    stopId: string,
    data: { date: string; time: string; notes: string; linkedDocIds: string[]; arrivals?: { date: string; time: string }[] },
  ) {
    try {
      // Always use arrivals array — construct from date/time if single arrival
      const arrivals = data.arrivals ?? [{ date: data.date, time: data.time }];
      const res = await fetch(`/api/plans/${plan._id}/stops/${stopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrivals, notes: data.notes, linkedDocIds: data.linkedDocIds }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const updated: Stop = await res.json();
      const newStops = stops
        .map((s) =>
          s._id === stopId ? { ...s, ...updated, _id: String(updated._id) } : s,
        )
        .sort((a, b) =>
          a.date !== b.date
            ? a.date.localeCompare(b.date)
            : a.time.localeCompare(b.time),
        )
        .map((s, i) => ({ ...s, order: i + 1 }));
      setStops(newStops);
      setTravelTimes((prev) =>
        prev.filter((t) => t.fromStopId !== stopId && t.toStopId !== stopId),
      );
      setSelectedStop(null);
      setEditStop(null);
      toast.success("Stop updated!");
    } catch (err) {
      toast.error(
        `Failed to update stop: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async function handleDeleteStop(stopId: string) {
    try {
      const res = await fetch(`/api/plans/${plan._id}/stops/${stopId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const newStops = stops
        .filter((s) => s._id !== stopId)
        .sort((a, b) =>
          a.date !== b.date
            ? a.date.localeCompare(b.date)
            : a.time.localeCompare(b.time),
        )
        .map((s, i) => ({ ...s, order: i + 1 }));
      setStops(newStops);
      setSelectedStop(null);
      // Remove travel times for deleted stop from local state
      setTravelTimes((prev) =>
        prev.filter((t) => t.fromStopId !== stopId && t.toStopId !== stopId),
      );
      toast.success("Stop removed");
    } catch (err) {
      toast.error(
        `Failed to delete stop: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async function handleAddArrival(stopId: string, newDate: string, newTime: string) {
    const stop = stops.find((s) => s._id === stopId);
    if (!stop) return;
    const currentArrivals = stop.arrivals && stop.arrivals.length > 0
      ? stop.arrivals
      : [{ date: stop.date, time: stop.time }];
    const updatedArrivals = [...currentArrivals, { date: newDate, time: newTime }];
    try {
      const res = await fetch(`/api/plans/${plan._id}/stops/${stopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrivals: updatedArrivals }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: Stop = await res.json();
      setStops((prev) =>
        prev.map((s) =>
          s._id === stopId ? { ...s, ...updated, _id: String(updated._id) } : s,
        ),
      );
      setSelectedStop((prev) =>
        prev?._id === stopId ? { ...prev, arrivals: updated.arrivals } : prev,
      );
      setTravelTimes((prev) =>
        prev.filter((t) => t.fromStopId !== stopId && t.toStopId !== stopId),
      );
      toast.success("Arrival added!");
    } catch {
      toast.error("Failed to add arrival");
    }
  }

  async function handleRemoveArrival(stopId: string, index: number) {
    const stop = stops.find((s) => s._id === stopId);
    if (!stop) return;
    const currentArrivals = stop.arrivals && stop.arrivals.length > 0
      ? stop.arrivals
      : [{ date: stop.date, time: stop.time }];
    if (currentArrivals.length <= 1) {
      toast.error("Cannot remove the only arrival");
      return;
    }
    const updatedArrivals = currentArrivals.filter((_, i) => i !== index);
    try {
      const res = await fetch(`/api/plans/${plan._id}/stops/${stopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrivals: updatedArrivals }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: Stop = await res.json();
      setStops((prev) =>
        prev.map((s) =>
          s._id === stopId ? { ...s, ...updated, _id: String(updated._id) } : s,
        ),
      );
      setSelectedStop((prev) =>
        prev?._id === stopId
          ? { ...prev, arrivals: updated.arrivals, date: updated.date, time: updated.time }
          : prev,
      );
      setTravelTimes((prev) =>
        prev.filter((t) => t.fromStopId !== stopId && t.toStopId !== stopId),
      );
      toast.success("Arrival removed");
    } catch {
      toast.error("Failed to remove arrival");
    }
  }

  async function handleCalculateAll() {
    setShowCalcConfirm(false);
    try {
      const res = await fetch(`/api/travel-time/calculate-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to calculate travel times");
        return;
      }
      if (Array.isArray(data)) setTravelTimes(data);
      toast.success("Travel times calculated!");
    } catch {
      toast.error("Failed to calculate travel times");
    } finally {
      setCalculating(false);
    }
  }

  async function handleEditTravelMode(
    fromStop: Stop,
    toStop: Stop,
    mode: "TRANSIT" | "DRIVE" | "WALK",
  ) {
    const res = await fetch("/api/travel-time/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan._id,
        fromStopId: fromStop._id,
        toStopId: toStop._id,
        fromLat: fromStop.lat,
        fromLng: fromStop.lng,
        toLat: toStop.lat,
        toLng: toStop.lng,
        toDate: toStop.date,
        toTime: toStop.time,
        mode,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Failed to get travel time");
      return;
    }
    setTravelTimes((prev) => {
      const idx = prev.findIndex(
        (t) => t.fromStopId === fromStop._id && t.toStopId === toStop._id,
      );
      if (idx >= 0)
        return prev.map((t, i) =>
          i === idx ? { ...data, _id: String(data._id) } : t,
        );
      return [...prev, { ...data, _id: String(data._id) }];
    });
    toast.success("Travel time updated!");
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background relative md:pt-16">
      {/* Top Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 z-10 shadow-sm flex-shrink-0">
        <div className="w-full max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push(`/trips/${plan._id}`)}
            className="p-1.5 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground truncate text-base">
              {plan.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {expandedStops.length} stop{expandedStops.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={() => setShowCalcConfirm(true)}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            title="Calculate travel times"
            disabled={calculating}
          >
            {calculating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Route className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`p-2 rounded-xl transition-colors ${filterFrom || filterTo ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground"}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          {/* Map/List toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as "map" | "list")}>
            <TabsList className="rounded-xl bg-muted p-1 h-9 w-40">
              <TabsTrigger
                value="map"
                className="flex-1 rounded-lg gap-1.5 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium"
              >
                <MapIcon className="w-4 h-4" /> Map
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="flex-1 rounded-lg gap-1.5 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium"
              >
                <List className="w-4 h-4" /> List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isArchived && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 text-yellow-800 text-sm flex-shrink-0">
          <Archive className="w-4 h-4 flex-shrink-0" />
          This trip is archived. Add and delete actions are disabled.
        </div>
      )}

      {showFilter && (
        <DateRangeFilter
          from={filterFrom}
          to={filterTo}
          onFromChange={setFilterFrom}
          onToChange={setFilterTo}
          onClear={() => {
            setFilterFrom("");
            setFilterTo("");
          }}
        />
      )}

      <div className="flex-1 relative overflow-hidden">
        {/* Map view */}
        <div
          className={`absolute inset-0 md:inset-x-4 md:inset-b-4 md:bottom-4 md:rounded-2xl overflow-hidden ${view === "map" ? "block" : "hidden"}`}
        >
          {/* Search box shown only after places library is loaded */}
          {mapLoaded && (
            <MapSearchBox
              map={googleMapRef.current}
              onSelect={handleSearchSelect}
            />
          )}
          {/* Map type toggle */}
          {mapLoaded && (
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
          )}
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && googleMapsApiKey && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Loading map...</p>
              </div>
            </div>
          )}
          {!googleMapsApiKey && (
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
          )}
        </div>

        {/* List view */}
        {view === "list" && (
          <StopsList
            stops={expandedStops}
            travelTimes={travelTimes}
            onSelect={(stop) => setSelectedStop(stop)}
            onEditTravelMode={(fromStopId, toStopId, currentMode) => {
              const fromStop = orderedStops.find((s) => s._id === fromStopId);
              const toStop = orderedStops.find((s) => s._id === toStopId);
              if (fromStop && toStop)
                setEditingTravelMode({ fromStop, toStop, currentMode });
            }}
          />
        )}
      </div>

      {/* Calculate Travel Times confirmation dialog */}
      <Dialog open={showCalcConfirm} onOpenChange={setShowCalcConfirm}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle>Calculate Travel Times</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Please ensure all your stops and times are finalised. Travel times
            will be calculated between consecutive stops on the same day.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This uses 1 of your monthly calculation credits.
          </p>
          <DialogFooter className="gap-2 flex-row mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowCalcConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleCalculateAll}
              disabled={calculating}
            >
              {calculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Calculating...
                </>
              ) : (
                "Calculate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingTravelMode && (
        <ModeEditSheet
          open={true}
          currentMode={editingTravelMode.currentMode}
          fromStopName={editingTravelMode.fromStop.name}
          toStopName={editingTravelMode.toStop.name}
          onClose={() => setEditingTravelMode(null)}
          onConfirm={(mode) =>
            handleEditTravelMode(
              editingTravelMode.fromStop,
              editingTravelMode.toStop,
              mode,
            )
          }
        />
      )}

      {pendingLocation && (
        <AddStopModal
          location={pendingLocation}
          tripDocs={tripDocs}
          onSave={handleSaveStop}
          onCancel={() => setPendingLocation(null)}
        />
      )}

      {(selectedStop || editStop) &&
        (() => {
          const allOrdered = expandedStops;
          const currentStop = selectedStop ?? editStop;
          const idx = allOrdered.findIndex(
            (s) =>
              s._id === currentStop!._id &&
              (s._arrivalIndex ?? 0) === (currentStop!._arrivalIndex ?? 0),
          );
          return (
            <StopDetailModal
              stop={editStop ?? selectedStop!}
              isEdit={!!editStop}
              tripDocs={tripDocs}
              hasPrev={idx > 0}
              hasNext={idx < allOrdered.length - 1}
              onPrev={() => {
                if (idx > 0) {
                  setSelectedStop(allOrdered[idx - 1]);
                  setEditStop(null);
                }
              }}
              onNext={() => {
                if (idx < allOrdered.length - 1) {
                  setSelectedStop(allOrdered[idx + 1]);
                  setEditStop(null);
                }
              }}
              onClose={() => {
                setSelectedStop(null);
                setEditStop(null);
              }}
              onEdit={() => {
                setEditStop(selectedStop);
                setSelectedStop(null);
              }}
              onSave={(data) =>
                handleUpdateStop((editStop ?? selectedStop!)._id, data)
              }
              onDelete={() => handleDeleteStop((editStop ?? selectedStop!)._id)}
              onAddArrival={(date, time) =>
                handleAddArrival((editStop ?? selectedStop!)._id, date, time)
              }
              onRemoveArrival={(index) =>
                handleRemoveArrival((editStop ?? selectedStop!)._id, index)
              }
            />
          );
        })()}

      {/* POI Info Panel — shown when user taps a Google Maps place icon */}
      {poiInfo && (
        <div className="absolute bottom-20 left-3 right-3 z-30 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
          {poiInfo.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poiInfo.thumbnail}
              alt={poiInfo.name}
              className="w-full h-32 object-cover"
            />
          )}
          <div className="p-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">
              {poiInfo.name}
            </h3>
            <p className="text-gray-400 text-xs mt-1 leading-snug">
              {poiInfo.address}
            </p>
            <div className="flex gap-2 mt-3">
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${poiInfo.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-9 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Google Maps
              </a>
              {!isArchived && (
                <button
                  className="flex-1 h-9 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    setPendingLocation(poiInfo);
                    setPoiInfo(null);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Plan
                </button>
              )}
              <button
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
                onClick={() => setPoiInfo(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

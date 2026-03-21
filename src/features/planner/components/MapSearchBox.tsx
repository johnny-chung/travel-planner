"use client";

import { useState, useRef, useCallback } from "react";
import { Search, X, MapPin, Loader2 } from "lucide-react";
import type { PendingLocation } from "@/features/planner/components/plan-map/types";

type Prediction = {
  mainText: string;
  secondaryText: string;
  placePrediction: google.maps.places.PlacePrediction;
};

type Props = {
  map: google.maps.Map | null;
  onSelect: (info: PendingLocation) => void;
  className?: string;
};

// Rendered only after importLibrary("places") has resolved in PlanMapClient.
// Uses the new AutocompleteSuggestion API (AutocompleteService is legacy-only).
export default function MapSearchBox({ map, onSelect, className }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim()) { setPredictions([]); setLoading(false); return; }
    try {
      const bounds = map?.getBounds() ?? undefined;
      const requestOptions: google.maps.places.AutocompleteRequest = { input };
      if (bounds) requestOptions.locationBias = bounds;
      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(requestOptions);
      setPredictions(
        suggestions
          .filter((s) => s.placePrediction)
          .map((s) => ({
            mainText: s.placePrediction!.mainText?.text ?? "",
            secondaryText: s.placePrediction!.secondaryText?.text ?? "",
            placePrediction: s.placePrediction!,
          }))
      );
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [map]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setPredictions([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  async function handleSelect(prediction: Prediction) {
    setQuery(prediction.mainText);
    setPredictions([]);
    setOpen(false);
    try {
      const place = prediction.placePrediction.toPlace();
      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location", "id",
                 "regularOpeningHours", "nationalPhoneNumber", "websiteURI", "photos", "rating", "userRatingCount"],
      });
      if (!place.location) return;
      if (map) { map.panTo(place.location); map.setZoom(16); }
      const thumbnail = place.photos?.[0]?.getURI({ maxWidth: 400 }) ?? "";
      onSelect({
        name: place.displayName ?? prediction.mainText,
        address: place.formattedAddress ?? prediction.mainText,
        lat: place.location.lat(),
        lng: place.location.lng(),
        placeId: place.id ?? "",
        openingHours: place.regularOpeningHours?.weekdayDescriptions ?? [],
        phone: place.nationalPhoneNumber ?? "",
        website: place.websiteURI ?? "",
        thumbnail,
        rating: place.rating ?? null,
        userRatingCount: place.userRatingCount ?? null,
      });
      fetch("/api/usage/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "places" }) }).catch(() => {});
      setQuery("");
    } catch {
      // Place detail fetch failed
    }
  }

  function handleClear() {
    setQuery("");
    setPredictions([]);
    setOpen(false);
  }

  const showDropdown = open && (loading || predictions.length > 0);

  return (
    <div className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search for a place..."
          className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-9 text-sm font-medium text-foreground shadow-lg outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        {!loading && query && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {loading && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Searching…</div>}
          {!loading && predictions.map((p, i) => (
            <button
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(p)}
              className="w-full flex items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/60"
            >
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{p.mainText}</p>
                <p className="truncate text-xs text-muted-foreground">{p.secondaryText}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


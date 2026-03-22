"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MapPin, X, Loader2 } from "lucide-react";
import { loadGoogleLibrary } from "@/lib/google-maps-loader";
import { getClientDictionary } from "@/features/i18n/client";

type LocationResult = {
  name: string;
  lat: number;
  lng: number;
  placeId: string;
  countryCode: string;
  thumbnail: string;
};

type Prediction = {
  mainText: string;
  secondaryText: string;
  placePrediction: google.maps.places.PlacePrediction;
};

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSelect: (loc: LocationResult) => void;
  apiKey: string;
};

export default function LocationSearchInput({ value, onChange, onSelect, apiKey }: Props) {
  const pathname = usePathname();
  const dictionary = getClientDictionary(pathname);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    const init = async () => {
      try {
        await loadGoogleLibrary<google.maps.PlacesLibrary>(apiKey, "places");
        setReady(true);
      } catch { /* Maps API unavailable */ }
    };
    init();
  }, [apiKey]);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim()) { setPredictions([]); setLoading(false); return; }
    try {
      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input });
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
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setPredictions([]); return; }
    if (!ready) return;
    setLoading(true);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  async function handleSelect(prediction: Prediction) {
    onChange(prediction.mainText);
    setPredictions([]);
    setOpen(false);
    try {
      const place = prediction.placePrediction.toPlace();
      await place.fetchFields({
        fields: ["formattedAddress", "location", "photos", "addressComponents"],
      });
      if (!place.location) return;
      const countryComponent = (
        (place.addressComponents as
          | Array<{ shortText?: string; types?: string[] }>
          | undefined) ?? []
      ).find((component) => component.types?.includes("country"));
      onSelect({
        name: place.formattedAddress ?? prediction.mainText,
        lat: place.location.lat(),
        lng: place.location.lng(),
        placeId: place.id ?? "",
        countryCode: countryComponent?.shortText?.toUpperCase() ?? "",
        thumbnail: place.photos?.[0]?.getURI({ maxWidth: 400, maxHeight: 400 }) ?? "",
      });
    } catch { /* fetch failed */ }
  }

  const showDropdown = open && ready && (loading || predictions.length > 0);

  return (
    <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={handleInput}
        onFocus={() => value && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={dictionary.common.locationExample}
        className="w-full h-11 pl-9 pr-9 rounded-xl border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {!loading && value && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onChange(""); setPredictions([]); setOpen(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {loading && (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground">
              {dictionary.planner.searching}
            </div>
          )}
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

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { loadGoogleLibrary } from "@/lib/google-maps-loader";

type LocationResult = {
  name: string;
  lat: number;
  lng: number;
  placeId: string;
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
      await place.fetchFields({ fields: ["formattedAddress", "location", "photos"] });
      if (!place.location) return;
      onSelect({
        name: place.formattedAddress ?? prediction.mainText,
        lat: place.location.lat(),
        lng: place.location.lng(),
        placeId: place.id ?? "",
        thumbnail: place.photos?.[0]?.getURI({ maxWidth: 400, maxHeight: 400 }) ?? "",
      });
    } catch { /* fetch failed */ }
  }

  const showDropdown = open && ready && (loading || predictions.length > 0);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
      <input
        type="text"
        value={value}
        onChange={handleInput}
        onFocus={() => value && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. Tokyo, Japan"
        className="w-full h-11 pl-9 pr-9 rounded-xl border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
      {!loading && value && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onChange(""); setPredictions([]); setOpen(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {loading && <div className="px-4 py-3 text-sm text-gray-400 text-center">Searching…</div>}
          {!loading && predictions.map((p, i) => (
            <button
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(p)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 transition-colors"
            >
              <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.mainText}</p>
                <p className="text-xs text-gray-400 truncate">{p.secondaryText}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

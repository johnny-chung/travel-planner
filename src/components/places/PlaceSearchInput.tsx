"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { loadGoogleLibrary } from "@/lib/google-maps-loader";
import type { PendingLocation } from "@/components/map/plan-map/types";

type Prediction = {
  mainText: string;
  secondaryText: string;
  placePrediction: google.maps.places.PlacePrediction;
};

type Props = {
  apiKey: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: PendingLocation) => void;
  placeholder?: string;
  includedPrimaryTypes?: string[];
  autoFocus?: boolean;
};

export default function PlaceSearchInput({
  apiKey,
  value,
  onChange,
  onSelect,
  placeholder = "Search for a place",
  includedPrimaryTypes,
  autoFocus = false,
}: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterKeyRef = useRef<string>("");
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
      } catch {
        setReady(false);
      }
    };

    void init();
  }, [apiKey]);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!input.trim()) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      try {
        const request: google.maps.places.AutocompleteRequest = { input };
        if (includedPrimaryTypes?.length) {
          request.includedPrimaryTypes = includedPrimaryTypes;
        }

        const { suggestions } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request,
          );
        setPredictions(
          suggestions
            .filter((suggestion) => suggestion.placePrediction)
            .map((suggestion) => ({
              mainText: suggestion.placePrediction!.mainText?.text ?? "",
              secondaryText: suggestion.placePrediction!.secondaryText?.text ?? "",
              placePrediction: suggestion.placePrediction!,
            })),
        );
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    },
    [includedPrimaryTypes],
  );

  useEffect(() => {
    if (!ready || !value.trim()) {
      return;
    }

    const nextFilterKey = (includedPrimaryTypes ?? []).join(",");
    if (filterKeyRef.current === nextFilterKey) {
      return;
    }

    filterKeyRef.current = nextFilterKey;
    setOpen(true);
    setLoading(true);
    void fetchSuggestions(value);
  }, [fetchSuggestions, includedPrimaryTypes, ready, value]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    onChange(nextValue);
    setOpen(true);
    filterKeyRef.current = (includedPrimaryTypes ?? []).join(",");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!nextValue.trim()) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    if (!ready) return;

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(nextValue);
    }, 250);
  }

  async function handleSelect(prediction: Prediction) {
    onChange(prediction.mainText);
    setPredictions([]);
    setOpen(false);
    setLoading(true);

    try {
      const place = prediction.placePrediction.toPlace();
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

      if (!place.location) {
        return;
      }

      onSelect({
        name: place.displayName ?? prediction.mainText,
        address: place.formattedAddress ?? prediction.mainText,
        lat: place.location.lat(),
        lng: place.location.lng(),
        placeId: place.id ?? "",
        openingHours: place.regularOpeningHours?.weekdayDescriptions ?? [],
        phone: place.nationalPhoneNumber ?? "",
        website: place.websiteURI ?? "",
        thumbnail: place.photos?.[0]?.getURI({ maxWidth: 400 }) ?? "",
        rating: place.rating ?? null,
        userRatingCount: place.userRatingCount ?? null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-input bg-background pl-9 pr-9 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        autoFocus={autoFocus}
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : value ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onChange("");
            setPredictions([]);
            setOpen(false);
            setLoading(false);
            filterKeyRef.current = (includedPrimaryTypes ?? []).join(",");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      {open && (loading || predictions.length > 0) ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            predictions.map((prediction, index) => (
              <button
                key={`${prediction.mainText}-${prediction.secondaryText}-${index}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(prediction)}
                className="flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {prediction.mainText}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {prediction.secondaryText}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

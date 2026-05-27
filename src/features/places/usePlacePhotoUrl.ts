"use client";

import { useEffect, useState } from "react";

import { loadGoogleLibrary } from "@/lib/google-maps-loader";

type SizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
};

const photoUrlCache = new Map<string, string>();

function buildCacheKey(placeId: string, options: SizeOptions) {
  return `${placeId}:${options.maxWidth ?? ""}x${options.maxHeight ?? ""}`;
}

export function usePlacePhotoUrl(
  placeId: string | undefined,
  fallbackUrl: string | undefined,
  options: SizeOptions = {},
) {
  const [photoUrl, setPhotoUrl] = useState((fallbackUrl ?? "").trim());

  useEffect(() => {
    setPhotoUrl((fallbackUrl ?? "").trim());
  }, [fallbackUrl]);

  useEffect(() => {
    const normalizedPlaceId = placeId?.trim() ?? "";
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

    if (!normalizedPlaceId || !apiKey) {
      return;
    }

    const cacheKey = buildCacheKey(normalizedPlaceId, options);
    const cachedUrl = photoUrlCache.get(cacheKey);
    if (cachedUrl) {
      setPhotoUrl(cachedUrl);
      return;
    }

    let cancelled = false;

    async function refreshPhotoUrl() {
      try {
        const { Place } =
          await loadGoogleLibrary<google.maps.PlacesLibrary>(apiKey, "places");
        const place = new Place({ id: normalizedPlaceId });
        await place.fetchFields({ fields: ["photos"] });
        const nextPhotoUrl =
          place.photos?.[0]?.getURI({
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
          }) ?? "";

        if (!nextPhotoUrl || cancelled) {
          return;
        }

        photoUrlCache.set(cacheKey, nextPhotoUrl);
        setPhotoUrl(nextPhotoUrl);
      } catch {
        // Keep the persisted URL as a fallback when photo refresh fails.
      }
    }

    void refreshPhotoUrl();

    return () => {
      cancelled = true;
    };
  }, [fallbackUrl, options.maxHeight, options.maxWidth, placeId]);

  return photoUrl;
}

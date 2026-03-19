"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

type LibraryName = Parameters<typeof importLibrary>[0];

let configuredApiKey: string | null = null;
let bootstrapPromise: Promise<void> | null = null;
const libraryPromises = new Map<LibraryName, Promise<unknown>>();

function assertApiKey(apiKey: string) {
  if (!apiKey) {
    throw new Error("Google Maps API key not configured");
  }

  if (configuredApiKey && configuredApiKey !== apiKey) {
    throw new Error("Google Maps loader already configured with a different API key");
  }
}

export function ensureGoogleMaps(apiKey: string) {
  assertApiKey(apiKey);

  if (typeof window.google?.maps?.importLibrary === "function") {
    configuredApiKey ??= apiKey;
    bootstrapPromise ??= Promise.resolve();
    return bootstrapPromise;
  }

  if (!bootstrapPromise) {
    configuredApiKey = apiKey;
    setOptions({ key: apiKey, v: "weekly" });
    bootstrapPromise = Promise.resolve();
  }

  return bootstrapPromise;
}

export async function loadGoogleLibrary<T>(
  apiKey: string,
  library: LibraryName,
) {
  await ensureGoogleMaps(apiKey);

  let promise = libraryPromises.get(library);
  if (!promise) {
    promise = importLibrary(library);
    libraryPromises.set(library, promise);
  }

  return promise as Promise<T>;
}

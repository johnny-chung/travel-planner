import "server-only";

export type PlannerSuggestionCategory =
  | "tourism"
  | "catering";

export type PlannerSuggestionItem = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type GeoapifyFeature = {
  properties?: {
    place_id?: string;
    name?: string;
    formatted?: string;
    lat?: number;
    lon?: number;
  };
};

type GeoapifyResponse = {
  features?: GeoapifyFeature[];
};

export async function getGeoapifyPlaceSuggestions(input: {
  lat: number;
  lng: number;
  category: PlannerSuggestionCategory;
  limit?: number;
}) {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) {
    return [] as PlannerSuggestionItem[];
  }

  const limit = input.limit ?? 20;
  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", input.category);
  url.searchParams.set(
    "filter",
    `circle:${input.lng},${input.lat},10000`,
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("apiKey", apiKey);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      return [] as PlannerSuggestionItem[];
    }

    const payload = (await response.json()) as GeoapifyResponse;
    return (payload.features ?? [])
      .map((feature) => {
        const properties = feature.properties;
        const lat = Number(properties?.lat);
        const lng = Number(properties?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        return {
          id:
            properties?.place_id ??
            `${properties?.name ?? "place"}:${lat}:${lng}`,
          name: properties?.name?.trim() || "Unnamed place",
          address: properties?.formatted?.trim() ?? "",
          lat,
          lng,
        } satisfies PlannerSuggestionItem;
      })
      .filter((item): item is PlannerSuggestionItem => item !== null);
  } catch {
    return [] as PlannerSuggestionItem[];
  }
}

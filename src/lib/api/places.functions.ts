import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { reverseGeocode } from "../maps/geocoding.server";

export type PlaceSuggestion = { placeId: string; description: string };

/**
 * Names the neighbourhood at a pair of browser-geolocation coordinates.
 *
 * Purely cosmetic: it gives "Use my location" something readable to put in the field.
 * The coordinates themselves are what get stored and mapped, so a null here costs a
 * nice label and nothing else — never gate a join on it.
 */
export const describeCoords = createServerFn({ method: "GET" })
  .inputValidator(z.object({ lat: z.number(), lng: z.number() }))
  .handler(async ({ data }): Promise<{ label: string | null }> => {
    if (!process.env.GOOGLE_MAPS_API_KEY) return { label: null };
    const label = await reverseGeocode(data.lat, data.lng).catch(() => null);
    return { label };
  });

// Maps each transport option to how Google should route it:
//  - bicycle / 2-wheeler  → "two_wheeler" (motorbike routing via the Routes API)
//  - auto / car / taxi     → "driving" (4-wheeler roads)
//  - metro / bus / train   → "transit" (public transport)
//  - walking               → "walking"
const TRANSPORT_TO_GOOGLE_MODE: Record<string, string> = {
  bicycle: "two_wheeler", bike: "two_wheeler", "2-wheeler": "two_wheeler", motorbike: "two_wheeler",
  car: "driving", taxi: "driving", auto: "driving",
  metro: "transit", bus: "transit", train: "transit",
  walking: "walking",
};

export type TravelDistance = { meters: number; seconds: number } | null;

// Two-wheeler routing lives only in the newer Routes API (computeRouteMatrix),
// not the legacy Distance Matrix API. One origin → many destinations.
async function computeTwoWheelerMatrix(
  origin: { lat: number; lng: number },
  destinations: { lat: number; lng: number }[],
  apiKey: string,
): Promise<TravelDistance[]> {
  const body = {
    origins: [
      { waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } } },
    ],
    destinations: destinations.map((d) => ({
      waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
    })),
    travelMode: "TWO_WHEELER",
    routingPreference: "TRAFFIC_AWARE",
  };

  const res = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,condition",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Routes API ${res.status}`);

  const rows = (await res.json()) as Array<{
    destinationIndex: number;
    condition?: string;
    duration?: string; // e.g. "1234s"
    distanceMeters?: number;
  }>;

  const out: TravelDistance[] = destinations.map(() => null);
  for (const r of rows) {
    if (r.condition === "ROUTE_EXISTS" && r.distanceMeters != null && r.duration) {
      out[r.destinationIndex] = {
        meters: r.distanceMeters,
        seconds: parseInt(r.duration.replace("s", ""), 10) || 0,
      };
    }
  }
  return out;
}

// Real road distance/time from one origin to many destinations via Google
// Distance Matrix — replaces straight-line haversine for user-facing labels.
export const getTravelDistances = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      origin: z.object({ lat: z.number(), lng: z.number() }),
      mode: z.string().default("driving"),
      destinations: z.array(z.object({ lat: z.number(), lng: z.number() })).max(200),
    }),
  )
  .handler(async ({ data }): Promise<TravelDistance[]> => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || data.destinations.length === 0) {
      return data.destinations.map(() => null);
    }

    const mode = TRANSPORT_TO_GOOGLE_MODE[data.mode] ?? "driving";

    // Two-wheeler: use the Routes API. If it's not enabled on the key (or fails),
    // fall back to legacy driving so the user still sees a road distance.
    if (mode === "two_wheeler") {
      try {
        const result = await computeTwoWheelerMatrix(data.origin, data.destinations, apiKey);
        if (result.some((r) => r != null)) return result;
      } catch {
        /* fall through to driving */
      }
    }

    const legacyMode = mode === "two_wheeler" ? "driving" : mode;
    const originStr = `${data.origin.lat},${data.origin.lng}`;
    const results: TravelDistance[] = [];

    // Distance Matrix allows max 25 destinations per request with 1 origin.
    for (let i = 0; i < data.destinations.length; i += 25) {
      const chunk = data.destinations.slice(i, i + 25);
      const dest = chunk.map((d) => `${d.lat},${d.lng}`).join("|");
      let url =
        `https://maps.googleapis.com/maps/api/distancematrix/json` +
        `?origins=${encodeURIComponent(originStr)}` +
        `&destinations=${encodeURIComponent(dest)}` +
        `&mode=${legacyMode}&units=metric&key=${apiKey}`;
      if (legacyMode === "driving") url += `&departure_time=now&traffic_model=best_guess`;

      try {
        const res = await fetch(url);
        const json = (await res.json()) as {
          status: string;
          rows: Array<{
            elements: Array<{
              status: string;
              duration: { value: number };
              duration_in_traffic?: { value: number };
              distance: { value: number };
            }>;
          }>;
        };
        const row = json.status === "OK" ? json.rows[0] : null;
        chunk.forEach((_, ci) => {
          const el = row?.elements[ci];
          if (el && el.status === "OK") {
            results.push({ meters: el.distance.value, seconds: el.duration_in_traffic?.value ?? el.duration.value });
          } else {
            results.push(null);
          }
        });
      } catch {
        chunk.forEach(() => results.push(null));
      }
    }

    return results;
  });

export const getPlaceSuggestions = createServerFn({ method: "GET" })
  .inputValidator(z.object({ query: z.string().min(2) }))
  .handler(async ({ data }): Promise<PlaceSuggestion[]> => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return [];

    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", data.query);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const json = (await res.json()) as {
      status: string;
      predictions: Array<{ place_id: string; description: string }>;
    };

    if (json.status !== "OK") return [];
    return json.predictions.slice(0, 5).map((p) => ({ placeId: p.place_id, description: p.description }));
  });

export const getPlaceCoords = createServerFn({ method: "GET" })
  .inputValidator(z.object({ placeId: z.string() }))
  .handler(async ({ data }): Promise<{ lat: number; lng: number; name: string } | null> => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", data.placeId);
    url.searchParams.set("fields", "geometry,name,formatted_address");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const json = (await res.json()) as {
      status: string;
      result: {
        name?: string;
        formatted_address?: string;
        geometry: { location: { lat: number; lng: number } };
      };
    };

    if (json.status !== "OK") return null;
    return {
      lat: json.result.geometry.location.lat,
      lng: json.result.geometry.location.lng,
      name: json.result.name ?? json.result.formatted_address ?? "Location",
    };
  });

export type NearbyPlace = {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingsTotal: number | null;
  vicinity: string;
  openNow: boolean | null;
  priceLevel: number | null;
  types: string[];
  photoUrl: string | null;
  lat: number;
  lng: number;
  mapsUrl: string;
};

export type NearbyPlacesPage = {
  places: NearbyPlace[];
  nextPageToken: string | null;
};

const TYPE_MAP: Record<string, string> = {
  restaurant: "restaurant",
  cafe: "cafe",
  bar: "bar",
  bakery: "bakery",
  meal_takeaway: "restaurant",
  food: "restaurant",
  park: "park",
  shopping_mall: "shopping_mall",
  night_club: "night_club",
};

const GLOBAL_MEAN = 4.0;
const MIN_VOTES = 50;

function weightedScore(r: { rating?: number; user_ratings_total?: number }) {
  const v = r.user_ratings_total ?? 0;
  const R = r.rating ?? 0;
  return (v / (v + MIN_VOTES)) * R + (MIN_VOTES / (v + MIN_VOTES)) * GLOBAL_MEAN;
}

export const getNearbyPlaces = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      lat: z.number(),
      lng: z.number(),
      type: z.string().default("restaurant"),
      radius: z.number().default(1000),
      pageToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<NearbyPlacesPage> => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Response("Maps API key not set", { status: 500 });

    const buildUrl = (token?: string) => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
      if (token) {
        url.searchParams.set("pagetoken", token);
      } else {
        url.searchParams.set("location", `${data.lat},${data.lng}`);
        url.searchParams.set("radius", String(data.radius));
        url.searchParams.set("type", TYPE_MAP[data.type] ?? data.type);
      }
      url.searchParams.set("key", apiKey);
      return url.toString();
    };

    type PlacesApiResponse = {
      status: string;
      next_page_token?: string;
      results: Array<{
        place_id: string;
        name: string;
        rating?: number;
        user_ratings_total?: number;
        vicinity?: string;
        opening_hours?: { open_now?: boolean };
        price_level?: number;
        types?: string[];
        photos?: Array<{ photo_reference: string }>;
        geometry: { location: { lat: number; lng: number } };
      }>;
    };

    // Retry up to 3 times for page tokens — Google needs ~2s before the token is valid
    let json: PlacesApiResponse | null = null;
    const maxAttempts = data.pageToken ? 3 : 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch(buildUrl(data.pageToken));
      if (!res.ok) throw new Response("Places API error", { status: 502 });
      json = (await res.json()) as PlacesApiResponse;
      if (json.status !== "INVALID_REQUEST") break;
    }

    if (!json) throw new Response("Places API error", { status: 502 });

    if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
      throw new Response(`Places API: ${json.status}`, { status: 502 });
    }

    const raw = json.results ?? [];
    const ranked = [...raw].sort((a, b) => weightedScore(b) - weightedScore(a));

    const places: NearbyPlace[] = ranked.map((r) => ({
      placeId: r.place_id,
      name: r.name,
      rating: r.rating ?? null,
      userRatingsTotal: r.user_ratings_total ?? null,
      vicinity: r.vicinity ?? "",
      openNow: r.opening_hours?.open_now ?? null,
      priceLevel: r.price_level ?? null,
      types: r.types ?? [],
      photoUrl: r.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${r.photos[0].photo_reference}&key=${apiKey}`
        : null,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
    }));

    return {
      places,
      nextPageToken: json.next_page_token ?? null,
    };
  });

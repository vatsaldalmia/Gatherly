import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

export const getNearbyPlaces = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      lat: z.number(),
      lng: z.number(),
      type: z.string().default("restaurant"),
      radius: z.number().default(1000),
    }),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Response("Maps API key not set", { status: 500 });

    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    url.searchParams.set("location", `${data.lat},${data.lng}`);
    url.searchParams.set("radius", String(data.radius));
    url.searchParams.set("type", TYPE_MAP[data.type] ?? data.type);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Response("Places API error", { status: 502 });

    const json = (await res.json()) as {
      status: string;
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

    if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
      throw new Response(`Places API: ${json.status}`, { status: 502 });
    }

    const places: NearbyPlace[] = (json.results ?? []).slice(0, 12).map((r) => ({
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

    return places;
  });

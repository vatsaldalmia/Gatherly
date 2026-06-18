import { createFileRoute, useSearch, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { getNearbyPlaces, type NearbyPlace } from "@/lib/api/places.functions";
import { MapPin, Star, Loader2, Navigation, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/venues")({
  head: () => ({ meta: [{ title: "Venues — Gatherly" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    area: typeof s.area === "string" ? s.area : undefined,
    lat: s.lat != null && !Number.isNaN(Number(s.lat)) ? Number(s.lat) : undefined,
    lng: s.lng != null && !Number.isNaN(Number(s.lng)) ? Number(s.lng) : undefined,
    radius: s.radius != null && !Number.isNaN(Number(s.radius)) ? Number(s.radius) : undefined,
  }),
  component: VenuesPage,
});

const CATS = [
  { id: "restaurant", label: "Restaurants" },
  { id: "cafe", label: "Cafés" },
  { id: "bar", label: "Bars" },
  { id: "park", label: "Parks" },
  { id: "shopping_mall", label: "Shopping" },
  { id: "night_club", label: "Nightlife" },
];

function priceStr(level: number | null) {
  if (level == null) return "";
  return "₹".repeat(Math.min(4, Math.max(1, level)));
}

type Coords = { lat: number; lng: number };

function VenuesPage() {
  const { area, lat, lng, radius } = useSearch({ from: "/_app/venues" });
  const router = useRouter();
  const [cat, setCat] = useState("restaurant");

  // Coords come from a meetup's best area (via search params) or browser geolocation.
  const meetupCoords: Coords | null = lat != null && lng != null ? { lat, lng } : null;
  const [geo, setGeo] = useState<Coords | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "denied" | "unsupported">("idle");
  const coords = meetupCoords ?? geo;

  // For a meetup we widen the search to cover everyone's neighbourhoods (passed
  // via `radius`); for standalone "near me" browsing we default to ~4.5 km.
  const searchRadius = Math.min(50000, Math.max(1000, radius ?? 4500));

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("idle");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Auto-ask for location when there's no meetup context yet.
  useEffect(() => {
    if (!meetupCoords && !geo && geoState === "idle") requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: places, isLoading, error } = useQuery({
    queryKey: ["venues-nearby", coords?.lat, coords?.lng, cat, searchRadius],
    queryFn: () => getNearbyPlaces({ data: { lat: coords!.lat, lng: coords!.lng, type: cat, radius: searchRadius } }),
    enabled: !!coords,
    staleTime: 5 * 60 * 1000,
  });

  const fromMeetup = !!meetupCoords;

  return (
    <>
      <AppTopbar title="Venues" />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Venues nearby</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {fromMeetup ? (
              <>
                Places
                {area ? <> near <span className="text-foreground font-medium">{area}</span></> : null}
                {" "}within {(searchRadius / 1000).toFixed(1)} km, sorted by rating.
              </>
            ) : geoState === "locating" ? (
              "Finding your location…"
            ) : coords ? (
              "Places near you, sorted by rating."
            ) : (
              "Enable location to see places near you."
            )}
          </p>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                cat === c.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Location gate — no coords yet (standalone mode) */}
        {!coords && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            {geoState === "locating" ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground mt-3">Detecting your location…</p>
              </>
            ) : (
              <>
                <Navigation className="h-7 w-7 text-muted-foreground mx-auto" />
                <h3 className="mt-3 font-semibold">
                  {geoState === "unsupported" ? "Location not available" : "Share your location"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {geoState === "denied"
                    ? "We couldn't access your location. Enable it in your browser, then try again."
                    : geoState === "unsupported"
                      ? "Your browser doesn't support geolocation. Open a meetup to see venues for your group."
                      : "We'll show real places right around you."}
                </p>
                {geoState !== "unsupported" && (
                  <Button variant="outline" className="mt-4" onClick={requestLocation}>
                    <Navigation className="h-4 w-4 mr-2" /> Use my location
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Loading places */}
        {coords && isLoading && (
          <div className="py-16 grid place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-3">Finding places…</p>
          </div>
        )}

        {/* Error */}
        {coords && error && (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Couldn't load venues. Check the Maps API key and try again.
          </div>
        )}

        {/* No results */}
        {coords && !isLoading && !error && places?.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No {CATS.find((c) => c.id === cat)?.label.toLowerCase()} found nearby. Try a different category.
          </div>
        )}

        {/* Results grid */}
        {coords && !isLoading && places && places.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {places.map((v) => (
              <VenueCard key={v.placeId} v={v} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function VenueCard({ v }: { v: NearbyPlace }) {
  return (
    <a
      href={v.mapsUrl}
      target="_blank"
      rel="noreferrer"
      className="group rounded-xl overflow-hidden border border-border bg-card hover:border-foreground/20 transition-colors flex flex-col"
    >
      <div className="aspect-[3/2] overflow-hidden relative bg-muted">
        {v.photoUrl ? (
          <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <MapPin className="h-7 w-7 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-snug truncate">{v.name}</h3>

        {/* Rating line — Maps/Yelp style */}
        <div className="flex items-center gap-1.5 mt-1 text-xs">
          {v.rating != null ? (
            <>
              <span className="font-medium text-foreground">{v.rating.toFixed(1)}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {v.userRatingsTotal != null && v.userRatingsTotal > 0 && (
                <span className="text-muted-foreground">
                  ({v.userRatingsTotal > 999 ? `${(v.userRatingsTotal / 1000).toFixed(1)}k` : v.userRatingsTotal})
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">No ratings yet</span>
          )}
          {priceStr(v.priceLevel) && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-muted-foreground">{priceStr(v.priceLevel)}</span>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{v.vicinity}</p>

        {v.openNow != null && (
          <p className={cn("text-xs font-medium mt-2", v.openNow ? "text-emerald-600" : "text-muted-foreground")}>
            {v.openNow ? "Open now" : "Closed"}
          </p>
        )}
      </div>
    </a>
  );
}

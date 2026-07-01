import { createFileRoute, useSearch, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
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
    // The viewing user's own coordinates — enables "X km from you" per venue.
    myLat: s.myLat != null && !Number.isNaN(Number(s.myLat)) ? Number(s.myLat) : undefined,
    myLng: s.myLng != null && !Number.isNaN(Number(s.myLng)) ? Number(s.myLng) : undefined,
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

// Straight-line distance (km) between two coordinates, for "X km from you".
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function distanceLabel(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m from you` : `${km.toFixed(1)} km from you`;
}

type Coords = { lat: number; lng: number };
type NamedCoords = Coords & { name: string };

function VenuesPage() {
  const { area, lat, lng, radius, myLat, myLng } = useSearch({ from: "/_app/venues" });
  const router = useRouter();
  const [cat, setCat] = useState("restaurant");

  const myCoords: Coords | null = myLat != null && myLng != null ? { lat: myLat, lng: myLng } : null;

  const fromDashboard = lat != null && lng != null;
  const urlCoords: NamedCoords | null = fromDashboard
    ? { lat: lat!, lng: lng!, name: area ?? "Selected area" }
    : null;

  // Restore last map search from session when navigating here directly
  const [savedSearch] = useState<NamedCoords | null>(() => {
    if (fromDashboard) return null;
    try {
      const raw = sessionStorage.getItem("lastMapSearch");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { lat: number; lng: number; name: string };
      if (parsed.lat && parsed.lng) return parsed;
    } catch { /* ignore */ }
    return null;
  });

  const [geo, setGeo] = useState<Coords | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "denied" | "unsupported">("idle");

  // URL params → last map search → geolocation
  const coords: Coords | null = urlCoords ?? savedSearch ?? geo;
  const locationLabel = urlCoords?.name ?? savedSearch?.name ?? null;
  const searchRadius = Math.min(50000, Math.max(1000, radius ?? 4500));

  const requestLocation = () => {
    if (!navigator.geolocation) { setGeoState("unsupported"); return; }
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

  useEffect(() => {
    if (!fromDashboard && !savedSearch && !geo && geoState === "idle") requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, error } = useInfiniteQuery({
    queryKey: ["venues-nearby", coords?.lat, coords?.lng, cat, searchRadius],
    queryFn: ({ pageParam }) =>
      getNearbyPlaces({
        data: { lat: coords!.lat, lng: coords!.lng, type: cat, radius: searchRadius, pageToken: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    enabled: !!coords,
    staleTime: 5 * 60 * 1000,
  });

  const GLOBAL_MEAN = 4.0;
  const MIN_VOTES = 50;
  const weightedScore = (rating: number | null, votes: number | null) => {
    const v = votes ?? 0;
    const R = rating ?? 0;
    return (v / (v + MIN_VOTES)) * R + (MIN_VOTES / (v + MIN_VOTES)) * GLOBAL_MEAN;
  };

  const places = (data?.pages.flatMap((p) => p.places) ?? []).sort(
    (a, b) => weightedScore(b.rating, b.userRatingsTotal) - weightedScore(a.rating, a.userRatingsTotal),
  );

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
            {locationLabel ? (
              <>Places near <span className="text-foreground font-medium">{locationLabel}</span>{radius ? ` within ${(searchRadius / 1000).toFixed(1)} km` : ""}.</>
            ) : geoState === "locating" ? (
              "Finding your location…"
            ) : coords ? (
              "Places near your current location, sorted by rating."
            ) : (
              "Enable location access to see venues near you."
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
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Location gate — no coords yet (standalone, geo not granted) */}
        {!coords && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            {geoState === "locating" ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-3">Detecting your location…</p>
              </>
            ) : (
              <>
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-3 font-semibold">Find venues near you</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {geoState === "denied"
                    ? "Location access was denied. Enable it in your browser settings and try again."
                    : geoState === "unsupported"
                      ? "Your browser doesn't support geolocation. Search from the dashboard map to find venues."
                      : "Share your location to discover the best places around you."}
                </p>
                {geoState !== "unsupported" && (
                  <Button className="mt-4" onClick={requestLocation}>
                    <Navigation className="h-4 w-4 mr-2" /> Use my location
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Initial loading */}
        {coords && isLoading && (
          <div className="py-16 grid place-items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Finding places…</p>
          </div>
        )}

        {/* Error */}
        {coords && error && (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Couldn't load venues. Check the Maps API key and try again.
          </div>
        )}

        {/* No results */}
        {coords && !isLoading && !error && places.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center space-y-2">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted grid place-items-center">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No {CATS.find((c) => c.id === cat)?.label.toLowerCase()} found nearby.</p>
            <p className="text-xs text-muted-foreground">Try a different category.</p>
          </div>
        )}

        {/* Results grid + infinite scroll */}
        {coords && !isLoading && places.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {places.map((v) => (
              <VenueCard
                key={v.placeId}
                v={v}
                distanceKm={myCoords ? haversineKm(myCoords, { lat: v.lat, lng: v.lng }) : null}
              />
            ))}
            <div ref={sentinelRef} className="col-span-full">
              {isFetchingNextPage && (
                <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading more venues…
                </div>
              )}
              {!hasNextPage && places.length > 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground/60">
                  All {places.length} venues loaded
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function VenueCard({ v, distanceKm }: { v: NearbyPlace; distanceKm: number | null }) {
  return (
    <a
      href={v.mapsUrl}
      target="_blank"
      rel="noreferrer"
      className="group rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      <div className="aspect-[3/2] overflow-hidden relative bg-muted">
        {v.photoUrl ? (
          <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full grid place-items-center bg-primary/5">
            <MapPin className="h-8 w-8 text-primary/30" />
          </div>
        )}
        {v.openNow != null && (
          <span className={cn(
            "absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full",
            v.openNow ? "bg-emerald-500/90 text-white" : "bg-black/50 text-white/80",
          )}>
            {v.openNow ? "Open" : "Closed"}
          </span>
        )}
        {distanceKm != null && (
          <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
            <Navigation className="h-2.5 w-2.5" /> {distanceLabel(distanceKm)}
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-snug truncate group-hover:text-primary transition-colors">{v.name}</h3>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs">
          {v.rating != null ? (
            <>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-semibold text-foreground">{v.rating.toFixed(1)}</span>
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
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">{v.vicinity}</p>
        <div className="mt-3 pt-3 border-t border-border/60">
          <span className="text-xs text-primary font-medium flex items-center gap-1">
            <MapPin className="h-3 w-3" /> View on Maps
          </span>
        </div>
      </div>
    </a>
  );
}

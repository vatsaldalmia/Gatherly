import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNearbyPlaces, type NearbyPlace } from "@/lib/api/places.functions";
import { MapPin, Star, ExternalLink, Loader2, UtensilsCrossed, Coffee, TreePine, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const CATEGORIES = [
  { id: "restaurant", label: "Restaurants", icon: UtensilsCrossed },
  { id: "cafe", label: "Cafés", icon: Coffee },
  { id: "park", label: "Parks", icon: TreePine },
  { id: "shopping_mall", label: "Shopping", icon: ShoppingBag },
];

function priceStr(level: number | null) {
  if (level == null) return "";
  return "₹".repeat(Math.max(1, level)) + "₹₹₹₹".slice(level);
}

function PlaceCard({ place }: { place: NearbyPlace }) {
  return (
    <a
      href={place.mapsUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-card-hover transition-all"
    >
      {/* Photo */}
      <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted">
        {place.photoUrl ? (
          <img src={place.photoUrl} alt={place.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full w-full grid place-items-center">
            <UtensilsCrossed className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{place.name}</p>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors mt-0.5" />
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {place.rating != null && (
            <span className="flex items-center gap-0.5 text-xs font-medium">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {place.rating.toFixed(1)}
              {place.userRatingsTotal != null && (
                <span className="text-muted-foreground font-normal ml-0.5">({place.userRatingsTotal > 999 ? `${(place.userRatingsTotal / 1000).toFixed(1)}k` : place.userRatingsTotal})</span>
              )}
            </span>
          )}
          {priceStr(place.priceLevel) && (
            <span className="text-xs text-muted-foreground">{priceStr(place.priceLevel)}</span>
          )}
          {place.openNow != null && (
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 h-4 border-0", place.openNow ? "bg-mint/20 text-mint" : "bg-muted text-muted-foreground")}
            >
              {place.openNow ? "Open" : "Closed"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" /> {place.vicinity}
        </p>
      </div>
    </a>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  areaName: string;
  lat: number;
  lng: number;
};

export function VenueSheet({ open, onOpenChange, areaName, lat, lng }: Props) {
  const [category, setCategory] = useState("restaurant");

  const { data: places, isLoading, error } = useQuery({
    queryKey: ["nearby-places", lat, lng, category],
    queryFn: () => getNearbyPlaces({ data: { lat, lng, type: category, radius: 1000 } }),
    enabled: open && lat != null && lng != null,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-lg">Venues near {areaName}</SheetTitle>
          <p className="text-sm text-muted-foreground">Real places your group can meet at.</p>
        </SheetHeader>

        {/* Category pills */}
        <div className="px-5 py-3 border-b border-border flex gap-2 overflow-x-auto scrollbar-none shrink-0">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                  active
                    ? "bg-gradient-primary text-primary-foreground border-transparent shadow-elegant"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <c.icon className="h-3 w-3" /> {c.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {isLoading && (
            <div className="py-12 grid place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-3">Finding places near {areaName}…</p>
            </div>
          )}

          {error && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <p>Couldn't load places. Check your Maps API key.</p>
            </div>
          )}

          {!isLoading && !error && places?.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No places found nearby. Try a different category.
            </div>
          )}

          {!isLoading && places?.map((place) => (
            <PlaceCard key={place.placeId} place={place} />
          ))}
        </div>

        <div className="px-5 py-4 border-t border-border shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(CATEGORIES.find(c => c.id === category)?.label ?? "restaurants")}/@${lat},${lng},15z`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open in Google Maps
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

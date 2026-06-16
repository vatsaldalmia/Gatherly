import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { venues } from "@/lib/dummy-data";
import { MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/venues")({
  head: () => ({ meta: [{ title: "Venues — Gatherly" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    area: typeof s.area === "string" ? s.area : undefined,
  }),
  component: VenuesPage,
});

const cats = ["All", "Restaurants", "Cafes", "Parks", "Coworking", "Entertainment"];

function VenuesPage() {
  const { area } = useSearch({ from: "/_app/venues" });
  const [cat, setCat] = useState("All");
  const list = cat === "All" ? venues : venues.filter((v) => v.category === cat);
  return (
    <>
      <AppTopbar title="Venues" />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Discover venues</h2>
          <p className="text-muted-foreground mt-1">
            {area ? <>Showing picks for <span className="text-foreground font-medium">{area}</span> — curated for your group.</>
              : "Curated places your group will love."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                cat === c
                  ? "bg-gradient-primary text-primary-foreground border-transparent shadow-elegant"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {list.map((v) => (
            <div key={v.id} className="group rounded-2xl overflow-hidden border border-border bg-card shadow-card hover:shadow-elegant transition-all">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src={v.image} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <Badge className={cn("absolute top-3 left-3 border-0", v.open ? "bg-mint text-mint-foreground" : "bg-muted text-muted-foreground")}>
                  {v.open ? "Open" : "Closed"}
                </Badge>
                <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/90 backdrop-blur text-xs font-semibold flex items-center gap-1">
                  <Star className="h-3 w-3 fill-mint text-mint" /> {v.rating}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate">{v.name}</h3>
                  <span className="text-sm text-muted-foreground">{v.cost}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{v.tag}</p>
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {v.address}
                </p>
                <Button size="sm" className="w-full mt-4">View details</Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
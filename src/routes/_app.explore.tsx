import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exploreCategories, explorePlans } from "@/lib/dummy-data";
import { Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/explore")({
  head: () => ({ meta: [{ title: "Explore — Gatherly" }] }),
  component: ExplorePage,
});

function ExplorePage() {
  const [cat, setCat] = useState("All");
  const cats = ["All", ...exploreCategories.map((c) => c.name)];
  const list = cat === "All" ? explorePlans : explorePlans.filter((p) => p.category === cat);
  return (
    <>
      <AppTopbar title="Explore" />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground p-8 sm:p-12 shadow-elegant">
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="relative max-w-2xl">
            <p className="text-xs uppercase tracking-wider opacity-80">For you</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight">Find what to do, this weekend.</h2>
            <p className="mt-3 opacity-90">Curated cafes, activities and weekend escapes — book solo or turn any into a group meetup.</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all",
                cat === c ? "bg-foreground text-background border-transparent" : "border-border bg-card hover:border-primary/40",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((p) => (
            <div key={p.id} className="group rounded-2xl overflow-hidden border border-border bg-card shadow-card hover:shadow-elegant transition-all">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="rounded-full">{p.category}</Badge>
                  <span className="text-xs flex items-center gap-1"><Star className="h-3 w-3 fill-mint text-mint" /> {p.rating}</span>
                </div>
                <h3 className="mt-3 font-semibold text-lg">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {p.duration}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold">{p.price}</span>
                  <Button size="sm" className="bg-gradient-primary shadow-elegant hover:opacity-90">Plan it</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { FairnessScore } from "@/components/fairness-score";
import { areas, meetups, venues } from "@/lib/dummy-data";
import { ArrowLeft, Clock, MapPin, Navigation, Route as RouteIcon, Share2, Vote } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/meetups/$id")({
  head: () => ({ meta: [{ title: "Meetup — Gatherly" }] }),
  component: MeetupResults,
});

function MeetupResults() {
  const { id } = useParams({ from: "/_app/meetups/$id" });
  const meetup = meetups.find((m) => m.id === id) ?? meetups[0];
  const [voted, setVoted] = useState<string | null>(null);

  return (
    <>
      <AppTopbar title={meetup.name} />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/meetups"><ArrowLeft className="h-4 w-4 mr-1.5" /> All meetups</Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="relative h-64 sm:h-80 bg-gradient-hero">
                <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:24px_24px]" />
                <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 600 320">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="600" height="320" fill="url(#grid)" />
                  <path d="M0 200 Q150 120 300 180 T600 140" stroke="white" strokeOpacity="0.4" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                  <path d="M80 50 Q200 220 380 90 T580 260" stroke="white" strokeOpacity="0.3" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                </svg>
                {meetup.members.slice(0, 5).map((m, i) => (
                  <div
                    key={m.name}
                    className="absolute"
                    style={{
                      left: `${15 + i * 16}%`,
                      top: `${30 + (i % 3) * 18}%`,
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-4 ring-white/30 shadow-elegant">
                        <AvatarImage src={m.avatar} />
                        <AvatarFallback>{m.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-card text-[10px] font-medium border border-border">
                        {m.location}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="h-14 w-14 rounded-full bg-mint grid place-items-center shadow-elegant ring-4 ring-white/50">
                    <MapPin className="h-6 w-6 text-mint-foreground" />
                  </div>
                  <p className="mt-2 text-xs text-white font-semibold text-center bg-black/40 backdrop-blur px-2 py-0.5 rounded-full">Best area</p>
                </div>
              </div>
              <div className="p-5 sm:p-6 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Top pick</p>
                  <h3 className="text-xl font-semibold mt-1">Powai, Mumbai</h3>
                  <p className="text-sm text-muted-foreground">Highest fairness score · 4 venues recommended</p>
                </div>
                <FairnessScore value={94} size="lg" />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recommended areas</h3>
                <Button variant="ghost" size="sm" onClick={() => toast.success("Link copied!")}>
                  <Share2 className="h-4 w-4 mr-1.5" /> Share
                </Button>
              </div>
              <div className="space-y-3">
                {areas.map((a) => (
                  <div key={a.name} className="p-5 rounded-2xl border border-border bg-card shadow-card grid grid-cols-[auto_minmax(0,1fr)_auto] gap-4 items-center">
                    <FairnessScore value={a.fairness} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{a.name}</h4>
                        {a.fairness >= 90 && <Badge className="bg-mint text-mint-foreground border-0">Top pick</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{a.description}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.travelTime} min avg</span>
                        <span className="flex items-center gap-1"><RouteIcon className="h-3 w-3" /> {a.distance} km avg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/venues">View venues</Link>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setVoted(a.name);
                          toast.success(`Voted for ${a.name}`);
                        }}
                        className={cn(voted === a.name && "bg-mint text-mint-foreground hover:bg-mint/90")}
                      >
                        <Vote className="h-3.5 w-3.5 mr-1.5" />
                        {voted === a.name ? "Voted" : "Vote"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20">
            <section className="rounded-2xl border border-border bg-card shadow-card p-5">
              <h3 className="font-semibold">Members ({meetup.members.length})</h3>
              <div className="mt-4 space-y-3">
                {meetup.members.map((m) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.avatar} />
                      <AvatarFallback>{m.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Navigation className="h-3 w-3" /> {m.location}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Joined</Badge>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card shadow-card p-5">
              <h3 className="font-semibold">Live vote tally</h3>
              <div className="mt-4 space-y-4">
                {areas.slice(0, 3).map((a, i) => {
                  const pct = [55, 30, 15][i];
                  return (
                    <div key={a.name}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{a.name}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} className="mt-1.5 h-2" />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4">Voting closes in 4 hours.</p>
            </section>

            <Button size="lg" className="w-full bg-gradient-primary shadow-elegant hover:opacity-90" asChild>
              <Link to="/venues"><MapPin className="h-4 w-4 mr-2" /> Browse venues</Link>
            </Button>
          </aside>
        </div>
      </main>
    </>
  );
}
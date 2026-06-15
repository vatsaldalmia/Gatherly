import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarRange,
  Plus,
  TrendingUp,
  Vote,
  Users,
  MapPin,
  Sparkles,
} from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FairnessScore } from "@/components/fairness-score";
import { meetups, venues } from "@/lib/dummy-data";

const TestMap = lazy(() => import("@/components/TestMap"));

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Gatherly" }] }),
  component: Dashboard,
});

function Dashboard() {
  const upcoming = meetups.filter((m) => m.status === "upcoming");
  const voting = meetups.filter((m) => m.status === "voting");
  const past = meetups.filter((m) => m.status === "past");

  const stats = [
    { label: "Upcoming meetups", value: upcoming.length, icon: CalendarRange, accent: "text-primary" },
    { label: "Pending votes", value: voting.length, icon: Vote, accent: "text-mint" },
    { label: "Recent plans", value: past.length + voting.length, icon: TrendingUp, accent: "text-primary" },
    { label: "Friends planning", value: 14, icon: Users, accent: "text-mint" },
  ];

  return (
    <>
      <AppTopbar title="Dashboard" />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground p-6 sm:p-10 shadow-elegant">
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="relative grid sm:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5" /> Good evening, Aarav
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">Ready to gather?</h2>
              <p className="mt-2 opacity-90 max-w-xl">
                You've got 2 meetups pending votes and a brunch crew waiting on Sunday.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="shadow-elegant">
              <Link to="/meetups/create">
                <Plus className="h-4 w-4 mr-2" /> New meetup
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl border border-border bg-card shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className={`h-9 w-9 rounded-xl grid place-items-center bg-muted ${s.accent}`}>
                  <s.icon className="h-4 w-4" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <section className="rounded-2xl border border-border bg-card shadow-card">
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Upcoming meetups</h3>
                <p className="text-sm text-muted-foreground">Plans your group has locked in.</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/meetups">View all</Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {upcoming.concat(voting).map((m) => (
                <Link
                  key={m.id}
                  to="/meetups/$id"
                  params={{ id: m.id }}
                  className="block p-5 sm:p-6 hover:bg-muted/40 transition-colors"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="rounded-full">{m.type}</Badge>
                        <Badge variant={m.status === "voting" ? "default" : "outline"} className={m.status === "voting" ? "bg-mint text-mint-foreground border-0" : ""}>
                          {m.status === "voting" ? "Voting open" : "Confirmed"}
                        </Badge>
                      </div>
                      <h4 className="mt-2 font-semibold truncate">{m.name}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {m.date} · {m.time}
                        {m.area && (
                          <>
                            {" · "}
                            <MapPin className="inline h-3 w-3 -mt-0.5 mr-0.5" />
                            {m.area}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {m.members.slice(0, 4).map((mm) => (
                        <Avatar key={mm.name} className="h-8 w-8 border-2 border-card">
                          <AvatarImage src={mm.avatar} />
                          <AvatarFallback>{mm.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                      {m.members.length > 4 && (
                        <div className="h-8 w-8 rounded-full border-2 border-card bg-muted grid place-items-center text-xs font-medium">
                          +{m.members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card shadow-card p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pending your vote</h3>
              <Badge className="bg-mint text-mint-foreground border-0">{voting.length}</Badge>
            </div>
            {voting.map((m) => (
              <div key={m.id} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.date} · {m.members.length} members</p>
                  </div>
                  <FairnessScore value={88 + (m.id.length % 6)} size="sm" />
                </div>
                <Button size="sm" asChild className="w-full">
                  <Link to="/meetups/$id" params={{ id: m.id }}>Vote now</Link>
                </Button>
              </div>
            ))}
          </section>
        </div>

        <DashboardMap />

        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Popular places nearby</h3>
              <p className="text-sm text-muted-foreground">Spots your group is loving this week.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/explore">Explore</Link>
            </Button>
          </div>
          <div className="p-5 sm:p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {venues.slice(0, 4).map((v) => (
              <div key={v.id} className="group rounded-xl overflow-hidden border border-border bg-background hover:shadow-elegant transition-all">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={v.image} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{v.name}</p>
                    <span className="text-xs">★ {v.rating}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.address}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function DashboardMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Meetup map</h3>
        <p className="text-sm text-muted-foreground">See where your group is gathering.</p>
      </div>
      {mounted ? (
        <Suspense
          fallback={
            <div className="h-[600px] grid place-items-center text-sm text-muted-foreground">
              Loading map…
            </div>
          }
        >
          <TestMap />
        </Suspense>
      ) : (
        <div className="h-[600px] bg-muted/40 animate-pulse" />
      )}
    </section>
  );
}
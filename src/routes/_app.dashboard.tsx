import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarRange,
  Plus,
  Vote,
  Users,
  MapPin,
  Clock,
  Trophy,
  Hourglass,
} from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FairnessScore } from "@/components/fairness-score";
import { useMeetupsListQuery } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/auth-client";
import type { ParticipantPin } from "@/components/TestMap";

const TestMap = lazy(() => import("@/components/TestMap"));

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Gatherly" }] }),
  component: Dashboard,
});

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const statusColor: Record<string, string> = {
  waiting: "bg-muted text-foreground",
  ready: "bg-primary/10 text-primary",
  voting: "bg-mint/20 text-mint",
  finalized: "bg-mint text-mint-foreground",
};

function Dashboard() {
  const { data: session } = useSession();
  const { data: allMeetups = [], isLoading } = useMeetupsListQuery();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const waiting = allMeetups.filter((m) => m.status === "waiting");
  const voting = allMeetups.filter((m) => m.status === "voting");
  const finalized = allMeetups.filter((m) => m.status === "finalized");
  const active = allMeetups.filter((m) => m.status !== "finalized");

  const totalParticipants = allMeetups.reduce((s, m) => s + m.participants.length, 0);

  const stats = [
    { label: "Active meetups", value: active.length, icon: CalendarRange, tile: "bg-teal-50 text-teal-600/90 dark:bg-teal-500/10 dark:text-teal-300/80", to: "/meetups" as const, search: { tab: "all" as const } },
    { label: "Pending votes", value: voting.length, icon: Vote, tile: "bg-emerald-50 text-emerald-600/90 dark:bg-emerald-500/10 dark:text-emerald-300/80", to: "/meetups" as const, search: { tab: "voting" as const } },
    { label: "Finalized", value: finalized.length, icon: Trophy, tile: "bg-cyan-50 text-cyan-600/90 dark:bg-cyan-500/10 dark:text-cyan-300/80", to: "/meetups" as const, search: { tab: "finalized" as const } },
    { label: "Total participants", value: totalParticipants, icon: Users, tile: "bg-sky-50 text-sky-600/90 dark:bg-sky-500/10 dark:text-sky-300/80", to: "/meetups" as const, search: { tab: "all" as const } },
  ];

  return (
    <>
      <AppTopbar title="Dashboard" />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero text-primary-foreground p-6 sm:p-9">
          <div className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -right-24 h-64 w-64 rounded-full bg-white/5" />
          <div className="relative grid sm:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="text-sm/none opacity-80">{timeGreeting()}, {firstName}</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                {allMeetups.length === 0 ? "Ready to gather?" : `${allMeetups.length} meetup${allMeetups.length === 1 ? "" : "s"} planned`}
              </h2>
              <p className="mt-1.5 text-sm opacity-90 max-w-xl">
                {voting.length > 0
                  ? `${voting.length} meetup${voting.length === 1 ? " needs" : "s need"} your vote right now.`
                  : waiting.length > 0
                    ? `${waiting.length} meetup${waiting.length === 1 ? " is" : "s are"} waiting for participants.`
                    : "Create a new meetup and share with your group."}
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="shrink-0">
              <Link to="/meetups/create">
                <Plus className="h-4 w-4 mr-2" /> New meetup
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              search={s.search}
              className="group block p-5 rounded-xl border border-border bg-card transition-colors hover:border-foreground/20"
            >
              <div className="flex items-center justify-between">
                <span className={`h-9 w-9 rounded-lg grid place-items-center ${s.tile}`}>
                  <s.icon className="h-4 w-4" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight">
                {isLoading ? <span className="inline-block h-6 w-8 rounded bg-muted animate-pulse" /> : s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </Link>
          ))}
        </div>

        {/* Meetup list + Vote panel */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          {/* All meetups */}
          <section className="rounded-2xl border border-border bg-card shadow-card">
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Your meetups</h3>
                <p className="text-sm text-muted-foreground">All the plans you're organising.</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/meetups">View all</Link>
              </Button>
            </div>
            {isLoading ? (
              <div className="divide-y divide-border">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-5 sm:p-6 flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : allMeetups.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
                  <CalendarRange className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium">No meetups yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Create your first meetup and Gatherly will find the fairest spot for everyone.
                </p>
                <Button asChild size="sm" className="mt-2">
                  <Link to="/meetups/create"><Plus className="h-3.5 w-3.5 mr-1.5" /> New meetup</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allMeetups.slice(0, 5).map((m) => (
                  <Link
                    key={m.id}
                    to="/meetups/$id"
                    params={{ id: m.id }}
                    search={{ created: undefined }}
                    className="block p-5 sm:p-6 hover:bg-muted/40 transition-colors"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="rounded-full capitalize">{m.type}</Badge>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[m.status] ?? "bg-muted text-foreground"}`}>
                            {m.status === "waiting" && <Hourglass className="h-2.5 w-2.5" />}
                            {m.status === "voting" && <Vote className="h-2.5 w-2.5" />}
                            {m.status === "finalized" && <Trophy className="h-2.5 w-2.5" />}
                            {m.status}
                          </span>
                        </div>
                        <h4 className="mt-2 font-semibold truncate">{m.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          {m.date && <span className="flex items-center gap-1"><CalendarRange className="h-3 w-3" />{m.date}{m.time ? ` · ${m.time}` : ""}</span>}
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{m.participants.length} joined</span>
                        </p>
                      </div>
                      <div className="flex -space-x-2 shrink-0">
                        {m.participants.slice(0, 4).map((p) => (
                          <Avatar key={p.id} className="h-8 w-8 border-2 border-card">
                            <AvatarImage src={p.avatar ?? undefined} />
                            <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                        {m.participants.length > 4 && (
                          <div className="h-8 w-8 rounded-full border-2 border-card bg-muted grid place-items-center text-xs font-medium">
                            +{m.participants.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Pending votes */}
          <section className="rounded-2xl border border-border bg-card shadow-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Pending your vote</h3>
              {voting.length > 0 && (
                <Badge className="bg-mint text-mint-foreground border-0">{voting.length}</Badge>
              )}
            </div>
            {voting.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-muted grid place-items-center">
                  <Vote className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No active votes right now.</p>
                <p className="text-xs text-muted-foreground/70">Once a host triggers the fairness engine, votes open here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {voting.map((m) => {
                  const topArea = m.areas?.slice().sort((a, b) => b.fairnessScore - a.fairnessScore)[0];
                  return (
                    <div key={m.id} className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {m.participants.length} participant{m.participants.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        {topArea && <FairnessScore value={topArea.fairnessScore} size="sm" />}
                      </div>
                      <Button size="sm" asChild className="w-full">
                        <Link to="/meetups/$id" params={{ id: m.id }} search={{ created: undefined }}>
                          Vote now
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Map */}
        <DashboardMap />
      </main>
    </>
  );
}

function DashboardMap() {
  const [mounted, setMounted] = useState(false);
  const { data: liveMeetups = [] } = useMeetupsListQuery();

  const participants = useMemo<ParticipantPin[]>(() => {
    const pins: ParticipantPin[] = [];
    for (const m of liveMeetups) {
      for (const p of m.participants) {
        if (p.lat != null && p.lng != null) {
          pins.push({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, meetupName: m.name });
        }
      }
    }
    return pins;
  }, [liveMeetups]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Meetup map</h3>
          <p className="text-sm text-muted-foreground">
            {participants.length > 0
              ? `${participants.length} participant${participants.length === 1 ? "" : "s"} across your meetups`
              : "See where your group is gathering."}
          </p>
        </div>
        {participants.length > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {liveMeetups.length} meetup{liveMeetups.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {mounted ? (
        <Suspense
          fallback={
            <div className="h-[500px] grid place-items-center text-sm text-muted-foreground">
              Loading map…
            </div>
          }
        >
          <TestMap participants={participants} />
        </Suspense>
      ) : (
        <div className="h-[500px] bg-muted/40 animate-pulse" />
      )}
    </section>
  );
}

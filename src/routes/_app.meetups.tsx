import { createFileRoute, Link, Outlet, useRouterState, useSearch } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMeetupsListQuery } from "@/lib/api/hooks";
import { DeleteMeetupButton } from "@/components/DeleteMeetupButton";
import { CalendarRange, MapPin, Plus, Users } from "lucide-react";

const TABS = ["all", "waiting", "ready", "voting", "finalized"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/_app/meetups")({
  head: () => ({ meta: [{ title: "Meetups — Gatherly" }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(s.tab as Tab) ? { tab: s.tab as Tab } : {},
  component: MeetupsLayout,
});

function MeetupsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/meetups") return <Outlet />;
  return <MeetupsList />;
}

function MeetupsList() {
  const { tab = "all" } = useSearch({ from: "/_app/meetups" });
  const navigate = Route.useNavigate();
  const { data: meetups = [], isLoading } = useMeetupsListQuery();
  return (
    <>
      <AppTopbar title="Meetups" />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your meetups</h2>
            <p className="text-muted-foreground mt-1">All the plans you're part of, in one place.</p>
          </div>
          <Button asChild className="bg-gradient-primary shadow-elegant">
            <Link to="/meetups/create">
              <Plus className="h-4 w-4 mr-2" /> New
            </Link>
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as Tab } })}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="waiting">Waiting</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
            <TabsTrigger value="voting">Voting</TabsTrigger>
            <TabsTrigger value="finalized">Finalized</TabsTrigger>
          </TabsList>
          {TABS.map((tabValue) => {
            const filtered = meetups.filter((m) => tabValue === "all" || m.status === tabValue);
            return (
            <TabsContent key={tabValue} value={tabValue} className="mt-6">
              {isLoading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map((n) => (
                    <div key={n} className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-pulse">
                      <div className="h-5 w-16 rounded bg-muted" />
                      <div className="h-6 w-40 rounded bg-muted" />
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="pt-4 border-t border-border flex gap-2">
                        {[1,2,3].map((k) => <div key={k} className="h-7 w-7 rounded-full bg-muted" />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="py-16 text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center">
                    <CalendarRange className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {tabValue === "all" ? "No meetups yet" : `No ${tabValue} meetups`}
                  </p>
                  {tabValue === "all" && (
                    <Button asChild size="sm" className="bg-gradient-primary shadow-elegant">
                      <Link to="/meetups/create"><Plus className="h-3.5 w-3.5 mr-1.5" />Create your first</Link>
                    </Button>
                  )}
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {!isLoading && filtered.map((m) => (
                  <Link
                    key={m.id}
                    to="/meetups/$id"
                    params={{ id: m.id }}
                    search={{ created: undefined }}
                    className="group p-5 rounded-2xl border border-border bg-card shadow-card hover:shadow-elegant hover:border-primary/40 transition-all flex flex-col"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="rounded-full capitalize">{m.type}</Badge>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={
                            m.status === "voting" || m.status === "finalized"
                              ? "bg-mint text-mint-foreground border-0"
                              : ""
                          }
                        >
                          {m.status}
                        </Badge>
                        <DeleteMeetupButton meetupId={m.id} meetupName={m.name} />
                      </div>
                    </div>
                    <h3 className="mt-4 font-semibold text-lg group-hover:text-primary transition-colors">{m.name}</h3>
                    {(m.date || m.time) && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                        <CalendarRange className="h-3.5 w-3.5" /> {m.date} {m.time && `· ${m.time}`}
                      </p>
                    )}
                    {m.finalizedAreaId && m.areas?.find((a: { id: string; name: string }) => a.id === m.finalizedAreaId) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {m.areas.find((a: { id: string; name: string }) => a.id === m.finalizedAreaId)?.name}
                      </p>
                    )}
                    <div className="flex-1" />
                    <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {m.participants.slice(0, 4).map((mm) => (
                          <Avatar key={mm.id} className="h-7 w-7 border-2 border-card">
                            <AvatarImage src={mm.avatar ?? undefined} />
                            <AvatarFallback className="text-xs">{mm.name[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                        {m.participants.length === 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> No one yet
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{m.participants.length} joined</span>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
          );
          })}
        </Tabs>
      </main>
    </>
  );
}
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMeetupsList } from "@/lib/meetup-store";
import { CalendarRange, MapPin, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/meetups")({
  head: () => ({ meta: [{ title: "Meetups — Gatherly" }] }),
  component: MeetupsLayout,
});

function MeetupsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/meetups") return <Outlet />;
  return <MeetupsList />;
}

function MeetupsList() {
  const meetups = useMeetupsList();
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

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="waiting">Waiting</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
            <TabsTrigger value="voting">Voting</TabsTrigger>
            <TabsTrigger value="finalized">Finalized</TabsTrigger>
          </TabsList>
          {(["all", "waiting", "ready", "voting", "finalized"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetups
                .filter((m) => tab === "all" || m.status === tab)
                .map((m) => (
                  <Link
                    key={m.id}
                    to="/meetups/$id"
                    params={{ id: m.id }}
                    className="group p-5 rounded-2xl border border-border bg-card shadow-card hover:shadow-elegant hover:border-primary/40 transition-all flex flex-col"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="rounded-full">{m.type}</Badge>
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
                    </div>
                    <h3 className="mt-4 font-semibold text-lg group-hover:text-primary transition-colors">{m.name}</h3>
                    {(m.date || m.time) && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                        <CalendarRange className="h-3.5 w-3.5" /> {m.date} {m.time && `· ${m.time}`}
                      </p>
                    )}
                    {m.finalizedArea && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {m.finalizedArea}
                      </p>
                    )}
                    <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {m.participants.slice(0, 4).map((mm) => (
                          <Avatar key={mm.id} className="h-7 w-7 border-2 border-card">
                            <AvatarImage src={mm.avatar} />
                            <AvatarFallback>{mm.name[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                        {m.participants.length === 0 && (
                          <span className="text-xs text-muted-foreground">No one yet</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{m.participants.length} joined</span>
                    </div>
                  </Link>
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </>
  );
}
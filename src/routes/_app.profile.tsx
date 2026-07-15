import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth/session.functions";
import { AppTopbar } from "@/components/app-topbar";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth/auth-client";
import { useMeetupsListQuery } from "@/lib/api/hooks";
import { MapPin, Calendar, Users, CalendarRange, LogOut } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  beforeLoad: ({ location }) => requireSession(location.href),
  head: () => ({ meta: [{ title: "Profile — Gatherly" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: session } = useSession();
  const { data: meetups = [] } = useMeetupsListQuery();
  const navigate = useNavigate();
  const user = session?.user;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const name = user?.name ?? "You";
  const email = user?.email ?? "";

  // Real stats derived from the user's meetups. The list also carries meetups they only
  // joined, so "planned" counts the ones they actually host — the rest are someone else's plan.
  const hosted = meetups.filter((m) => !!user && m.hostUserId === user.id);
  const totalParticipants = hosted.reduce((s, m) => s + m.participants.length, 0);
  const finalizedCount = meetups.filter((m) => m.finalizedAreaId).length;
  const stats = [
    { label: "Meetups planned", value: hosted.length, icon: Calendar },
    { label: "People gathered", value: totalParticipants, icon: Users },
    { label: "Spots finalized", value: finalizedCount, icon: MapPin },
  ];

  const recent = [...meetups].slice(0, 6);

  return (
    <>
      <AppTopbar title="Profile" />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-6">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="h-28 bg-gradient-hero" />
          <div className="px-6 sm:px-8 pb-6 -mt-10">
            <UserAvatar
              className="h-20 w-20 ring-4 ring-card"
              fallbackClassName="text-lg font-bold"
              name={name}
              email={email}
              image={user?.image}
              seed={user?.id}
            />
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold truncate">{name}</h2>
                <p className="text-muted-foreground text-sm truncate">{email}</p>
                {user?.emailVerified && (
                  <div className="mt-2">
                    <Badge variant="outline" className="rounded-full">Verified</Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" asChild>
                  <Link to="/settings">Edit profile</Link>
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1.5" /> Log out
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="p-5 rounded-xl border border-border bg-card">
              <s.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="rounded-xl border border-border bg-card">
          <div className="p-5 sm:p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Recent meetups</h3>
          </div>
          {recent.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="mx-auto h-11 w-11 rounded-full bg-muted grid place-items-center">
                <CalendarRange className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No meetups yet.</p>
              <Button size="sm" asChild>
                <Link to="/meetups/create">Create your first</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((m) => (
                <Link
                  key={m.id}
                  to="/meetups/$id"
                  params={{ id: m.id }}
                  search={{ created: undefined }}
                  className="block p-5 sm:p-6 hover:bg-muted/40 transition-colors"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{m.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {m.date ? `${m.date} · ` : ""}{m.type} · {m.participants.length} joined
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{m.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

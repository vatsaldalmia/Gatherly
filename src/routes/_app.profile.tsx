import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-topbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { meetups } from "@/lib/dummy-data";
import { MapPin, Calendar, Users } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Gatherly" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const stats = [
    { label: "Meetups planned", value: 24, icon: Calendar },
    { label: "Friends connected", value: 38, icon: Users },
    { label: "Cities explored", value: 6, icon: MapPin },
  ];
  return (
    <>
      <AppTopbar title="Profile" />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-8">
        <div className="rounded-3xl border border-border bg-card shadow-card overflow-hidden">
          <div className="h-40 bg-gradient-hero" />
          <div className="px-6 sm:px-8 pb-6 -mt-12">
            <Avatar className="h-24 w-24 ring-4 ring-card shadow-elegant">
              <AvatarImage src="https://i.pravatar.cc/200?img=12" />
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold truncate">Aarav Mehta</h2>
                <p className="text-muted-foreground text-sm">aarav@gatherly.app · Mumbai, India</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">Pro member</Badge>
                  <Badge variant="outline" className="rounded-full">Verified</Badge>
                </div>
              </div>
              <Button variant="outline">Edit profile</Button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="p-5 rounded-2xl border border-border bg-card shadow-card">
              <s.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-3xl font-bold tracking-tight">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="p-5 sm:p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Recent meetups</h3>
          </div>
          <div className="divide-y divide-border">
            {meetups.map((m) => (
              <div key={m.id} className="p-5 sm:p-6 grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.date} · {m.type}</p>
                </div>
                <Badge variant="outline" className="capitalize">{m.status}</Badge>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getMyParticipantId,
  setMyParticipantId,
  TRANSPORT_OPTIONS,
  type TransportMode,
} from "@/lib/meetup-store";
import { useMeetupQuery, useAddParticipant } from "@/lib/api/hooks";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import {
  MapPin,
  Loader2,
  Check,
  Footprints,
  Bike,
  Car,
  TrainFront,
  Train,
  Bus,
  CarTaxiFront,
  Users,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AutoRickshaw } from "@/components/icons/auto-rickshaw";

export const Route = createFileRoute("/meetup/$id")({
  head: () => ({ meta: [{ title: "Join meetup — Gatherly" }] }),
  component: JoinMeetup,
});

const transportIcons: Record<TransportMode, ComponentType<SVGProps<SVGSVGElement>>> = {
  walking: Footprints,
  bicycle: Bike,
  "2-wheeler": Bike,
  auto: AutoRickshaw,
  car: Car,
  taxi: CarTaxiFront,
  metro: TrainFront,
  train: Train,
  bus: Bus,
};

function JoinMeetup() {
  const { id } = useParams({ from: "/meetup/$id" });
  const { data: meetup, isLoading } = useMeetupQuery(id);
  const addParticipantMutation = useAddParticipant();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [placeId, setPlaceId] = useState<string | undefined>();
  const [transport, setTransport] = useState<TransportMode>("car");
  const [locating, setLocating] = useState(false);
  const [joined, setJoined] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setJoined(getMyParticipantId(id));
  }, [id]);

  // Order transport options by how many people already in this meetup picked each
  // mode — most-used first — so joiners see the group's common choices up top.
  // Modes nobody picked keep their default order after the used ones.
  const orderedTransport = useMemo(() => {
    const counts = new Map<TransportMode, number>();
    for (const p of meetup?.participants ?? []) {
      const t = p.transport as TransportMode;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return TRANSPORT_OPTIONS.map((opt, i) => ({ opt, i, count: counts.get(opt.id) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.i - b.i)
      .map((x) => x.opt);
  }, [meetup?.participants]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading meetup…</p>
        </div>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="text-center max-w-sm">
          <Logo />
          <div className="mt-8 h-16 w-16 mx-auto rounded-2xl bg-muted grid place-items-center">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mt-6">Meetup not found</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This link may have expired or the meetup no longer exists.
          </p>
          <Button asChild className="mt-6 bg-gradient-primary shadow-elegant">
            <Link to="/">Back to Gatherly</Link>
          </Button>
        </div>
      </div>
    );
  }

  const useLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!address) setAddress(`Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setLocating(false);
        toast.success("Location detected");
      },
      () => {
        setLocating(false);
        toast.error("Permission denied — type your area instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("Add your name and a location to join.");
      return;
    }
    try {
      const result = await addParticipantMutation.mutateAsync({
        meetupId: meetup.id,
        name: name.trim(),
        address: address.trim(),
        transport,
        placeId,
      });
      setMyParticipantId(meetup.id, result.id);
      setJoined(result.id);
      toast.success("You're in!");
    } catch {
      toast.error("Failed to join. Please try again.");
    }
  };

  // Joined state
  if (joined) {
    const me = meetup.participants.find((p) => p.id === joined);
    return (
      <div className="min-h-screen bg-background">
        <header className="px-5 py-4 border-b border-border flex items-center">
          <Logo />
        </header>
        <main className="max-w-md mx-auto px-5 py-16 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-primary grid place-items-center shadow-elegant">
            <Check className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">
            You're in{me?.name ? `, ${me.name}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            We've noted your location and travel preference. You'll be able to vote once the host finds the best spots.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card shadow-card p-5 text-left space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Meetup</p>
              <h2 className="font-semibold mt-1">{meetup.name}</h2>
              <p className="text-sm text-muted-foreground">Hosted by {meetup.hostName}</p>
            </div>
            {meetup.participants.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> {meetup.participants.length} joined
                </p>
                <div className="flex -space-x-2">
                  {meetup.participants.slice(0, 8).map((p) => (
                    <Avatar key={p.id} className="h-8 w-8 border-2 border-card">
                      <AvatarImage src={p.avatar ?? undefined} />
                      <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button asChild className="mt-6 w-full h-11 bg-gradient-primary shadow-elegant">
            <Link to="/meetups/$id" params={{ id: meetup.id }} search={{ created: undefined }}>
              View meetup dashboard
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur z-10">
        <Logo />
        <Badge variant="secondary" className="rounded-full text-xs">Invite link</Badge>
      </header>

      <main className="max-w-md mx-auto px-5 py-8 pb-36">
        {/* Meetup info */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="rounded-full capitalize mb-3">{meetup.type}</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{meetup.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {meetup.hostName} is finding a fair spot for everyone.
          </p>
          {meetup.participants.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {meetup.participants.slice(0, 5).map((p) => (
                  <Avatar key={p.id} className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={p.avatar ?? undefined} />
                    <AvatarFallback className="text-[10px]">{p.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{meetup.participants.length} already joined</span>
            </div>
          )}
          {meetup.date && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              {meetup.date}{meetup.time ? ` · ${meetup.time}` : ""}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-5 rounded-2xl border border-border bg-card shadow-card p-5 sm:p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="address">Starting location</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useLocation}
                disabled={locating}
                className="h-7 text-xs px-2"
              >
                {locating
                  ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Detecting…</>
                  : <><MapPin className="h-3 w-3 mr-1" /> Use my location</>
                }
              </Button>
            </div>
            <AddressAutocomplete
              id="address"
              value={address}
              onChange={(v) => { setAddress(v); setPlaceId(undefined); }}
              onSelect={(desc, pid) => { setAddress(desc); setPlaceId(pid || undefined); }}
              placeholder="Neighbourhood or address"
              required
            />
            <p className="text-xs text-muted-foreground">We use this only to find a fair meetup point.</p>
          </div>

          <div className="space-y-2">
            <Label>How will you get there?</Label>
            <div className="grid grid-cols-4 gap-2">
              {orderedTransport.map((t) => {
                const Icon = transportIcons[t.id];
                const active = transport === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTransport(t.id)}
                    className={cn(
                      "p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all",
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto space-y-2">
          <Button
            onClick={submit}
            disabled={addParticipantMutation.isPending || !name.trim() || !address.trim()}
            className="w-full h-12 bg-gradient-primary shadow-elegant hover:opacity-90 text-base font-semibold"
          >
            {addParticipantMutation.isPending
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining…</>
              : "Join meetup"
            }
          </Button>
          <p className="text-[11px] text-center text-muted-foreground">
            No account needed · your location is only shared with the group
          </p>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  addParticipant,
  getMyParticipantId,
  setMyParticipantId,
  TRANSPORT_OPTIONS,
  useMeetup,
  type TransportMode,
} from "@/lib/meetup-store";
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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/meetup/$id")({
  head: () => ({ meta: [{ title: "Join meetup — Gatherly" }] }),
  component: JoinMeetup,
});

const transportIcons: Record<TransportMode, typeof Footprints> = {
  walking: Footprints,
  bike: Bike,
  car: Car,
  taxi: CarTaxiFront,
  metro: TrainFront,
  train: Train,
  bus: Bus,
};

function JoinMeetup() {
  const { id } = useParams({ from: "/meetup/$id" });
  const meetup = useMeetup(id);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [transport, setTransport] = useState<TransportMode>("car");
  const [locating, setLocating] = useState(false);
  const [joined, setJoined] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setJoined(getMyParticipantId(id));
  }, [id]);

  if (!meetup) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="text-center max-w-sm">
          <Logo />
          <h1 className="text-2xl font-bold mt-8">Meetup not found</h1>
          <p className="text-muted-foreground mt-2">
            This link may have expired or the meetup hasn't been created on this device yet.
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
        setCoords({ lat: latitude, lng: longitude });
        if (!address) {
          setAddress(`Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setLocating(false);
        toast.success("Location detected");
      },
      () => {
        setLocating(false);
        toast.error("Permission denied — please type your area instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("Add your name and a location to join.");
      return;
    }
    const p = addParticipant(meetup.id, {
      name: name.trim(),
      address: address.trim(),
      lat: coords?.lat,
      lng: coords?.lng,
      transport,
    });
    setMyParticipantId(meetup.id, p.id);
    setJoined(p.id);
    toast.success("You're in! The host can now find the best area.");
  };

  if (joined) {
    return (
      <div className="min-h-screen bg-background">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <Logo />
        </header>
        <main className="max-w-md mx-auto px-5 py-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-mint/20 grid place-items-center">
            <Check className="h-8 w-8 text-mint" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">You're in, {meetup.participants.find((p) => p.id === joined)?.name ?? "friend"}!</h1>
          <p className="text-muted-foreground mt-2">
            We'll factor in your location and travel preference. You'll get to vote once the host shares the recommended spots.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card shadow-card p-5 text-left">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meetup</p>
            <h2 className="font-semibold mt-1">{meetup.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">Hosted by {meetup.hostName}</p>
            <div className="mt-4 flex -space-x-2">
              {meetup.participants.slice(0, 8).map((p) => (
                <Avatar key={p.id} className="h-8 w-8 border-2 border-card">
                  <AvatarImage src={p.avatar} />
                  <AvatarFallback>{p.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{meetup.participants.length} joined</p>
          </div>

          <Button asChild className="mt-6 w-full h-11 bg-gradient-primary shadow-elegant">
            <Link to="/meetups/$id" params={{ id: meetup.id }}>View meetup dashboard</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur z-10">
        <Logo />
        <Badge variant="secondary" className="rounded-full">
          <Sparkles className="h-3 w-3 mr-1" /> Invite
        </Badge>
      </header>

      <main className="max-w-md mx-auto px-5 py-8 pb-32">
        <div className="text-center">
          <Badge variant="outline" className="rounded-full">{meetup.type}</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3">{meetup.name}</h1>
          <p className="text-muted-foreground mt-1">
            {meetup.hostName} invited you to help pick a fair meetup spot.
          </p>
          {meetup.participants.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {meetup.participants.slice(0, 5).map((p) => (
                  <Avatar key={p.id} className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={p.avatar} />
                    <AvatarFallback>{p.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{meetup.participants.length} joined</span>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl border border-border bg-card shadow-card p-5">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya" className="h-11" required />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="address">Your location</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useLocation}
                disabled={locating}
                className="h-7 text-xs"
              >
                {locating ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Detecting…</>
                ) : (
                  <><MapPin className="h-3.5 w-3.5 mr-1" /> Use current location</>
                )}
              </Button>
            </div>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Neighbourhood or address"
              className="h-11"
              required
            />
            {coords && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Check className="h-3 w-3 text-mint" />
                Detected: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>How will you get there?</Label>
            <div className="grid grid-cols-4 gap-2">
              {TRANSPORT_OPTIONS.map((t) => {
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
                        ? "border-primary bg-primary/5 shadow-elegant"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-[11px] font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-background/0">
          <div className="max-w-md mx-auto">
            <Button onClick={submit} className="w-full h-12 bg-gradient-primary shadow-elegant hover:opacity-90 text-base">
              Join meetup
            </Button>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              No account required. Your location stays with the group.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
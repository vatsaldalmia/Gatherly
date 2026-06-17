import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Users,
  HeartHandshake,
  Briefcase,
  HeartIcon,
  BookOpen,
  Cake,
  Trophy,
  Sparkles,
  Car,
  Bike,
  TrainFront,
  Train,
  Footprints,
  Bus,
  CarTaxiFront,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateMeetup, useAddParticipant } from "@/lib/api/hooks";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { useSession } from "@/lib/auth/auth-client";
import { setMyParticipantId, type TransportMode } from "@/lib/meetup-store";

export const Route = createFileRoute("/_app/meetups/create")({
  head: () => ({ meta: [{ title: "Create meetup — Gatherly" }] }),
  component: CreateMeetup,
});

const types = [
  { id: "friends", label: "Friends", icon: Users },
  { id: "family", label: "Family", icon: HeartHandshake },
  { id: "office", label: "Office", icon: Briefcase },
  { id: "date", label: "Date", icon: HeartIcon },
  { id: "study", label: "Study Session", icon: BookOpen },
  { id: "birthday", label: "Birthday", icon: Cake },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "custom", label: "Custom", icon: Sparkles },
];

const transportOptions: { id: TransportMode; label: string; icon: typeof Car }[] = [
  { id: "car", label: "Car", icon: Car },
  { id: "bike", label: "Bike", icon: Bike },
  { id: "metro", label: "Metro", icon: TrainFront },
  { id: "train", label: "Train", icon: Train },
  { id: "bus", label: "Bus", icon: Bus },
  { id: "taxi", label: "Taxi", icon: CarTaxiFront },
  { id: "walking", label: "Walk", icon: Footprints },
];

function CreateMeetup() {
  const navigate = useNavigate();
  const createMeetupMutation = useCreateMeetup();
  const addParticipantMutation = useAddParticipant();
  const { data: session } = useSession();

  const [type, setType] = useState("friends");
  const [budget, setBudget] = useState([1500]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [myAddress, setMyAddress] = useState("");
  const [myTransport, setMyTransport] = useState<TransportMode>("car");

  const displayName = session?.user?.name ?? "You";

  return (
    <>
      <AppTopbar title="Create meetup" />
      <main className="flex-1 px-4 sm:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Plan a new meetup</h1>
            <p className="text-muted-foreground mt-2">
              Tell us a bit about it — your friends can join in one tap.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!myAddress.trim()) {
                toast.error("Add your starting location so we can calculate fair spots.");
                return;
              }
              const finalName = name.trim() || "Untitled meetup";
              try {
                const result = await createMeetupMutation.mutateAsync({
                  name: finalName,
                  type: types.find((t) => t.id === type)?.label ?? "Friends",
                  date: date || undefined,
                  time: time || undefined,
                  notes: notes || undefined,
                });

                // Auto-join as first participant
                const joined = await addParticipantMutation.mutateAsync({
                  meetupId: result.id,
                  name: displayName,
                  address: myAddress.trim(),
                  transport: myTransport,
                });
                setMyParticipantId(result.id, joined.id);

                toast.success("Meetup created! Share the link with your group.");
                navigate({
                  to: "/meetups/$id",
                  params: { id: result.id },
                  search: { created: 1 } as never,
                });
              } catch {
                toast.error("Failed to create meetup. Please try again.");
              }
            }}
            className="space-y-8 rounded-2xl border border-border bg-card shadow-card p-6 sm:p-8"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Meetup name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunday brunch crew" required className="h-11" />
            </div>

            <div className="space-y-3">
              <Label>Meetup type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {types.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      type === t.id
                        ? "border-primary bg-primary/5 shadow-elegant"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <t.icon className={cn("h-5 w-5", type === t.id ? "text-primary" : "text-muted-foreground")} />
                    <p className="mt-2 text-sm font-medium">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Budget per person</Label>
                <span className="text-sm font-semibold">₹{budget[0]}</span>
              </div>
              <Slider value={budget} onValueChange={setBudget} min={200} max={5000} step={100} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹200</span><span>₹5,000+</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Preferred date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Preferred time</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11" />
              </div>
            </div>

            {/* Host location — used as first participant */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-4">
              <div>
                <p className="font-medium text-sm">Your starting location</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You'll be added as the first participant — we need this to find a fair spot for everyone.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="myAddress">Where are you coming from?</Label>
                <AddressAutocomplete
                  id="myAddress"
                  value={myAddress}
                  onChange={setMyAddress}
                  onSelect={(desc) => setMyAddress(desc)}
                  placeholder="Your neighbourhood or address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>How will you get there?</Label>
                <div className="flex flex-wrap gap-2">
                  {transportOptions.map((t) => {
                    const active = myTransport === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMyTransport(t.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:border-primary/40",
                        )}
                      >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any vibes, requests, or specific cuisines?" rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Invite friends</Label>
              <Select defaultValue="link">
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Anyone with the link</SelectItem>
                  <SelectItem value="invite">Specific people only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" className="sm:flex-1" onClick={() => navigate({ to: "/meetups" })}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMeetupMutation.isPending || addParticipantMutation.isPending}
                className="sm:flex-[2] bg-gradient-primary shadow-elegant hover:opacity-90 h-11"
              >
                {createMeetupMutation.isPending || addParticipantMutation.isPending ? "Creating..." : "Create meetup"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const travel = [
  { id: "car", label: "Car", icon: Car },
  { id: "bike", label: "Bike", icon: Bike },
  { id: "metro", label: "Metro", icon: TrainFront },
  { id: "train", label: "Train", icon: Train },
  { id: "walking", label: "Walking", icon: Footprints },
];

function CreateMeetup() {
  const navigate = useNavigate();
  const [type, setType] = useState("friends");
  const [budget, setBudget] = useState([1500]);
  const [travelMode, setTravelMode] = useState<string[]>(["car", "metro"]);

  const toggleTravel = (id: string) =>
    setTravelMode((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

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
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Meetup created! Share the link with friends.");
              navigate({ to: "/meetups/$id", params: { id: "m-102" } });
            }}
            className="space-y-8 rounded-2xl border border-border bg-card shadow-card p-6 sm:p-8"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Meetup name</Label>
              <Input id="name" placeholder="Sunday brunch crew" required className="h-11" />
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
                <Input id="date" type="date" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Preferred time</Label>
                <Input id="time" type="time" className="h-11" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Travel preference (pick all that apply)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {travel.map((t) => {
                  const active = travelMode.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleTravel(t.id)}
                      className={cn(
                        "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all",
                        active ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40",
                      )}
                    >
                      <t.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" placeholder="Any vibes, requests, or specific cuisines?" rows={3} />
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
              <Button type="submit" className="sm:flex-[2] bg-gradient-primary shadow-elegant hover:opacity-90 h-11">
                Create meetup
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
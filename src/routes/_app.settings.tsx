import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { authClient, useSession } from "@/lib/auth/auth-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Gatherly" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { data: session } = useSession();
  const user = session?.user;

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  // Keep the field in sync once the session loads.
  if (user && name === "" && user.name) setName(user.name);

  const saveAccount = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name can't be empty.");
      return;
    }
    setSaving(true);
    const { error } = await authClient.updateUser({ name: trimmed });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save changes.");
    } else {
      toast.success("Profile updated.");
    }
  };

  return (
    <>
      <AppTopbar title="Settings" />
      <main className="flex-1 px-4 sm:px-8 py-8 max-w-3xl space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h2>

        <section className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-4">
          <h3 className="font-semibold">Account</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} disabled readOnly />
            </div>
          </div>
          <Button onClick={saveAccount} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save changes"}
          </Button>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-4">
          <h3 className="font-semibold">Preferences</h3>
          {[
            { label: "Dark mode", desc: "Switch between light and dark themes.", checked: theme === "dark", onChange: toggle },
            { label: "Email notifications", desc: "Get an email when a meetup updates.", checked: true },
            { label: "Vote reminders", desc: "Ping me when voting is about to close.", checked: true },
            { label: "Suggest nearby venues", desc: "Use my location to recommend better spots.", checked: false },
          ].map((p) => (
            <div key={p.label} className="flex items-center justify-between gap-4 py-2">
              <div className="min-w-0">
                <p className="font-medium text-sm">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              <Switch defaultChecked={p.checked} onCheckedChange={p.onChange} />
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-destructive/30 bg-card shadow-card p-6 space-y-3">
          <h3 className="font-semibold text-destructive">Danger zone</h3>
          <p className="text-sm text-muted-foreground">Permanently delete your account and all of your meetups.</p>
          <Button variant="destructive">Delete account</Button>
        </section>
      </main>
    </>
  );
}
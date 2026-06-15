import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-topbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Gatherly" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  return (
    <>
      <AppTopbar title="Settings" />
      <main className="flex-1 px-4 sm:px-8 py-8 max-w-3xl space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h2>

        <section className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-4">
          <h3 className="font-semibold">Account</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full name</Label><Input defaultValue="Aarav Mehta" /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue="aarav@gatherly.app" /></div>
            <div className="space-y-2"><Label>City</Label><Input defaultValue="Mumbai" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+91 98765 43210" /></div>
          </div>
          <Button onClick={() => toast.success("Saved")} className="bg-gradient-primary shadow-elegant hover:opacity-90">Save changes</Button>
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
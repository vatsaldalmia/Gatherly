import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, SocialButtons } from "@/components/auth-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Gatherly" },
      { name: "description", content: "Log in to your Gatherly account to start planning meetups." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue planning with your group."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <SocialButtons />
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or with email</span></div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => {
            toast.success("Welcome back!");
            navigate({ to: "/dashboard" });
          }, 600);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required className="h-11" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</a>
          </div>
          <Input id="password" type="password" placeholder="••••••••" required className="h-11" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary shadow-elegant hover:opacity-90">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </AuthShell>
  );
}
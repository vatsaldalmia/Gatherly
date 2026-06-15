import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, SocialButtons } from "@/components/auth-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Gatherly" },
      { name: "description", content: "Create a free Gatherly account and plan your first group meetup in seconds." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever for personal use. No credit card."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
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
            toast.success("Welcome to Gatherly!");
            navigate({ to: "/dashboard" });
          }, 600);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Aarav Mehta" required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 8 characters" required className="h-11" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary shadow-elegant hover:opacity-90">
          {loading ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          By signing up you agree to our <a href="#" className="underline hover:text-foreground">Terms</a> and{" "}
          <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </form>
    </AuthShell>
  );
}
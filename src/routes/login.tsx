import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Phone/OTP login is hidden: there is no SMS provider configured, so sending an OTP was a
// silent no-op that still reported "code sent". Restore AuthMethodTabs + PhoneOTPForm here
// once TWILIO_* secrets are set on the Worker.
import { AuthShell, SocialButtons } from "@/components/auth-shell";
import { toast } from "sonner";
import { signIn } from "@/lib/auth/auth-client";

// Where to go after signing in. The value comes from the URL (`/login?redirect=…`), so it is
// attacker-controllable: an absolute URL would turn our own login page into a redirector to any
// site on the internet. Only same-site paths are honoured — and `//evil.com` is absolute
// (protocol-relative) despite the leading slash, so it is rejected too.
function safeRedirect(target: string | undefined): string {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return "/dashboard";
  return target;
}

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s.redirect === "string" ? { redirect: s.redirect } : {},
  head: () => ({
    meta: [
      { title: "Log in — Gatherly" },
      {
        name: "description",
        content: "Log in to your Gatherly account to start planning meetups.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue planning with your group."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" search={{ redirect }} className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <SocialButtons />

      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            const result = await signIn.email({ email, password });
            if (result.error) {
              toast.error(result.error.message ?? "Login failed");
              return;
            }
            toast.success("Welcome back!");
            navigate({ to: safeRedirect(redirect) });
          } catch {
            toast.error("Something went wrong. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            className="h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            className="h-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-gradient-primary shadow-elegant hover:opacity-90"
        >
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </AuthShell>
  );
}

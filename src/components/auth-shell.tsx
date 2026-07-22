import { type ReactNode, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Phone, Mail } from "lucide-react";
import { signIn } from "@/lib/auth/auth-client";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> New: live venue voting
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            Stop debating. <br /> Start gathering.
          </h2>
          <p className="opacity-90 leading-relaxed">
            Pick the perfect meetup spot in seconds. Fair to everyone, fun for everyone.
          </p>
        </div>
        <p className="relative text-sm opacity-70">© {new Date().getFullYear()} Gatherly Inc.</p>
      </div>
      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between lg:hidden">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Back home</Link>
          </Button>
        </div>
        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
            <div className="mt-8 space-y-4">{children}</div>
            <div className="mt-8 text-sm text-muted-foreground text-center">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SocialButtons({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    await signIn.social({ provider: "google", callbackURL });
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      className="w-full h-12 text-base font-medium"
      onClick={handleGoogle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <svg className="h-5 w-5 mr-2.5" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c11 0 19.5-8 19.5-19.5 0-1.3-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 7 29.2 5 24 5 16.3 5 9.7 9.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-2 13.2-5.2l-6.1-5c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3-11.3-7.4l-6.5 5C9.6 39.2 16.3 43.5 24 43.5z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.1 5c-.4.4 6.5-4.7 6.5-14.6 0-1.3-.1-2.3-.4-3.5z"/>
        </svg>
      )}
      Continue with Google
    </Button>
  );
}

export function AuthMethodTabs({
  activeTab,
  onChange,
}: {
  activeTab: "phone" | "email";
  onChange: (tab: "phone" | "email") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
      {(["phone", "email"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
            activeTab === tab
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab === "phone" ? <Phone className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
          {tab === "phone" ? "Phone" : "Email"}
        </button>
      ))}
    </div>
  );
}

export function PhoneOTPForm({ requireName = false }: { requireName?: boolean }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rawDigits, setRawDigits] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    if (requireName && !name.trim()) return;
    setLoading(true);
    try {
      // @ts-ignore — phoneNumber plugin adds this method
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
      if (result?.error) {
        toast.error(result.error.message ?? "Failed to send OTP");
        return;
      }
      toast.success("OTP sent to your phone!");
      setStep("otp");
    } catch {
      toast.error("Could not send OTP. Check the number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    try {
      // @ts-ignore — phoneNumber plugin adds this method
      const result = await signIn.phoneNumber({ phoneNumber: phone, code: otp, callbackURL: "/dashboard" });
      if (result?.error) {
        toast.error(result.error.message ?? "Invalid OTP");
        return;
      }
      // Save the name the user entered
      await authClient.updateUser({ name: name.trim() }).catch(() => {});
      toast.success("Welcome to Gatherly!");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            OTP sent to <span className="font-medium text-foreground">{phone}</span>
          </p>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => { setStep("phone"); setOtp(""); }}
          >
            Change number
          </button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="otp">6-digit OTP</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="• • • • • •"
            required
            className="h-11 tracking-[0.4em] text-center font-mono text-lg"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
          />
        </div>
        <Button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full h-11 bg-gradient-primary shadow-elegant hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {loading ? "Verifying…" : "Verify & Continue"}
        </Button>
        <button
          type="button"
          className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
          onClick={handleSendOTP}
          disabled={loading}
        >
          Didn't receive it? Resend OTP
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOTP} className="space-y-4">
      {requireName && (
        <div className="space-y-2">
          <Label htmlFor="phone-name">Your name</Label>
          <Input
            id="phone-name"
            type="text"
            placeholder="Aarav Mehta"
            required
            className="h-11"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <div className="flex gap-2">
          <div className="flex items-center h-11 px-3 border border-input rounded-md bg-muted text-sm font-medium text-muted-foreground shrink-0">
            🇮🇳 +91
          </div>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            required
            className="h-11 flex-1"
            value={rawDigits}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              setRawDigits(digits);
              setPhone(digits ? `+91${digits}` : "");
            }}
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-gradient-primary shadow-elegant hover:opacity-90"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {loading ? "Sending OTP…" : "Send OTP"}
      </Button>
    </form>
  );
}

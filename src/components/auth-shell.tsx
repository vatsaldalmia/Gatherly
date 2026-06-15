import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

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

export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="outline" className="h-11">
        <svg className="h-4 w-4 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c11 0 19.5-8 19.5-19.5 0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 7 29.2 5 24 5 16.3 5 9.7 9.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-2 13.2-5.2l-6.1-5c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3-11.3-7.4l-6.5 5C9.6 39.2 16.3 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.1 5c-.4.4 6.5-4.7 6.5-14.6 0-1.3-.1-2.3-.4-3.5z"/></svg>
        Google
      </Button>
      <Button variant="outline" className="h-11">
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.04c-.03-3.16 2.58-4.68 2.7-4.75-1.47-2.15-3.76-2.45-4.57-2.48-1.95-.2-3.8 1.15-4.79 1.15-.99 0-2.51-1.12-4.12-1.09-2.12.03-4.08 1.23-5.17 3.13-2.2 3.83-.56 9.5 1.59 12.6 1.05 1.52 2.3 3.22 3.93 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.45 1.02 4.12.99 1.7-.03 2.78-1.55 3.82-3.07 1.2-1.76 1.7-3.47 1.72-3.56-.04-.02-3.3-1.27-3.34-5.06zM14.04 3.06c.87-1.06 1.46-2.53 1.3-4-1.25.05-2.77.83-3.67 1.89-.8.93-1.5 2.43-1.31 3.87 1.4.11 2.81-.71 3.68-1.76z"/></svg>
        Apple
      </Button>
    </div>
  );
}
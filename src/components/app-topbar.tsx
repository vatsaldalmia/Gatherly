import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/lib/auth/auth-client";

// Initials for the avatar fallback, used until the image loads and whenever the
// provider gave us no photo at all (email/password signups have none).
function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "YO";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AppTopbar({ title }: { title?: string }) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="h-full px-4 sm:px-6 flex items-center gap-3">
        {title && (
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        )}
        <div className="flex-1" />
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Link to="/profile">
          <Avatar className="h-9 w-9 ring-2 ring-border">
            {/* Google hands us the photo on the session as user.image; email/password
                users have none, so the initials fallback is the normal case, not an error. */}
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "You"} />
            <AvatarFallback>{initials(user?.name, user?.email)}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
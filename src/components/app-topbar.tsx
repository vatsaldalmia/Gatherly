import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/lib/auth/auth-client";

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
          <UserAvatar
            className="h-9 w-9 ring-2 ring-border"
            name={user?.name}
            email={user?.email}
            image={user?.image}
            seed={user?.id}
          />
        </Link>
      </div>
    </header>
  );
}
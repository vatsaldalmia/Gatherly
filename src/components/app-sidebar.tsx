import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarRange,
  MapPin,
  User,
  Plus,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth/auth-client";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Meetups", url: "/meetups", icon: CalendarRange },
  { title: "Venues", url: "/venues", icon: MapPin },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: session } = useSession();
  const navigate = useNavigate();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "ME";

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground sticky top-0 h-screen self-start">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center border-b border-sidebar-border">
        <Logo to="/dashboard" />
      </div>

      {/* New meetup CTA */}
      <div className="px-3 pt-4 pb-2">
        <Button
          asChild
          className="w-full bg-gradient-primary shadow-elegant hover:opacity-90 h-10 rounded-xl font-semibold"
        >
          <Link to="/meetups/create">
            <Plus className="h-4 w-4 mr-2" /> New meetup
          </Link>
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {items.map((item) => {
          const active =
            item.url === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/70",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-sidebar-foreground/40",
                )}
              />
              {item.title}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="group flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent/60 transition-colors cursor-default">
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-border">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback className="text-xs font-bold bg-gradient-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-none">{user?.name ?? "You"}</p>
            <p className="text-[11px] text-sidebar-foreground/50 truncate mt-0.5">{user?.email ?? ""}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
            aria-label="Sign out"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

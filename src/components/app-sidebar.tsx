import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarRange,
  Compass,
  User,
  Settings,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Meetups", url: "/meetups", icon: CalendarRange },
  { title: "Explore", url: "/explore", icon: Compass },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="h-16 px-5 flex items-center border-b border-sidebar-border">
        <Logo to="/dashboard" />
      </div>
      <div className="px-3 py-4">
        <Button asChild className="w-full bg-gradient-primary shadow-elegant hover:opacity-90">
          <Link to="/meetups/create">
            <Plus className="h-4 w-4 mr-2" /> New meetup
          </Link>
        </Button>
      </div>
      <nav className="flex-1 px-3 space-y-1">
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
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 m-3 rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
        <p className="text-sm font-semibold">Upgrade to Pro</p>
        <p className="text-xs opacity-90 mt-1">Unlimited meetups & advanced fairness.</p>
        <Button size="sm" variant="secondary" className="mt-3 w-full">
          See plans
        </Button>
      </div>
    </aside>
  );
}
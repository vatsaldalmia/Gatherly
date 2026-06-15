import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 group">
      <div className="relative h-8 w-8 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant transition-transform group-hover:scale-105">
        <Users className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-mint border-2 border-background" />
      </div>
      <span className="text-lg font-bold tracking-tight">Gatherly</span>
    </Link>
  );
}
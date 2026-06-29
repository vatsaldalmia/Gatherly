import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppTopbar({ title }: { title?: string }) {
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
            <AvatarImage src="https://i.pravatar.cc/100?img=12" alt="You" />
            <AvatarFallback>YO</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
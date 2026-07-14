import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";

// No guard here on purpose. This layout also wraps the meetup page, which anyone holding the
// invite link must be able to open — see requireSession() in lib/auth/session.functions.ts.
// The private pages under it guard themselves.
export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}

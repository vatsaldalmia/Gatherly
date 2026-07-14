import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { fetchSession } from "@/lib/auth/session.functions";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const session = await fetchSession();
    if (!session) {
      // Carry the page they were trying to reach through the login, so signing in lands them
      // there rather than on the dashboard. Following an invite link into a meetup used to
      // mean logging in and then having to find your way back to it by hand.
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { session };
  },
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

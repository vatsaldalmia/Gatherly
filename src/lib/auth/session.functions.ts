import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { getSessionOptional } from "./auth-middleware.server";

// Isomorphic session check for route guards. Runs on the server (during SSR
// and on client navigation it's an RPC), reading the session straight from the
// request cookies — no self-fetch to a hardcoded origin/port.
export const fetchSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSessionOptional();
  if (!session?.user) return null;
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
  };
});

/**
 * `beforeLoad` guard for the pages that are genuinely yours — your dashboard, your meetup list,
 * your profile.
 *
 * It is deliberately *not* on the /_app layout. A meetup page has to stay reachable by link
 * alone: the invite promises "no account needed", and an invite tapped inside WhatsApp or Gmail
 * opens in that app's own browser, which carries none of your cookies. Guarding the layout meant
 * every one of those arrivals hit a login wall — on the same phone where you were signed in.
 */
export async function requireSession(href: string) {
  const session = await fetchSession();
  if (!session) throw redirect({ to: "/login", search: { redirect: href } });
  return session;
}

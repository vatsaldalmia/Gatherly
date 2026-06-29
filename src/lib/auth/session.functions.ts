import { createServerFn } from "@tanstack/react-start";
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

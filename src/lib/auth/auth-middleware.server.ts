import { getRequest } from "@tanstack/react-start/server";
import { getAuth } from "./auth.server";

// Use inside createServerFn handlers. Throws 401 if no valid session cookie.
export async function requireAuth() {
  const request = getRequest();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session as { user: { id: string; name: string; email: string } };
}

// Returns session without throwing — for optional-auth endpoints.
export async function getSessionOptional() {
  const request = getRequest();
  const auth = getAuth();
  return auth.api.getSession({ headers: request.headers });
}

import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

// Reaching D1 from `vite dev`. The Workers runtime hands the app a `DB` binding, but Vite's
// dev server is plain Node — no binding exists there. D1's HTTP API is the only other door
// into the same database, so we drive it through drizzle's sqlite-proxy driver: drizzle
// hands us raw SQL + params, we POST them, we hand back rows.

export type D1HttpCredentials = {
  accountId: string;
  databaseId: string;
  apiToken: string;
};

export function readD1HttpCredentials(): D1HttpCredentials | undefined {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_D1_API_TOKEN;
  if (accountId && databaseId && apiToken) return { accountId, databaseId, apiToken };

  // Half-configured is the trap: with two of the three set, the caller silently falls back to
  // a local dev.db that has no tables in it, and every login 500s with "no such table: user" —
  // which reads like a broken app rather than a missing token. Say so instead.
  const missing = [
    !accountId && "CLOUDFLARE_ACCOUNT_ID",
    !databaseId && "CLOUDFLARE_D1_DATABASE_ID",
    !apiToken && "CLOUDFLARE_D1_API_TOKEN",
  ].filter(Boolean);
  if (missing.length < 3) {
    console.warn(
      `[db] Ignoring the D1 HTTP credentials: ${missing.join(", ")} ${
        missing.length === 1 ? "is" : "are"
      } empty in .env. Falling back to the local SQLite file — run \`bunx drizzle-kit push\` if it has no tables yet.`,
    );
  }
  return undefined;
}

type D1RawResponse = {
  success: boolean;
  errors?: { code: number; message: string }[];
  // `/raw` (unlike `/query`) returns rows as positional arrays rather than objects, which is
  // exactly the shape sqlite-proxy expects — no column-name round trip needed.
  result?: { results?: { columns: string[]; rows: unknown[][] } }[];
};

export function createD1HttpDb({ accountId, databaseId, apiToken }: D1HttpCredentials) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`;

  return drizzleProxy(
    async (sql, params, method) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      });

      const payload = (await response.json()) as D1RawResponse;

      if (!response.ok || !payload.success) {
        const detail =
          payload.errors?.map((e) => `${e.code} ${e.message}`).join("; ") ??
          `HTTP ${response.status}`;
        throw new Error(`D1 HTTP query failed: ${detail}`);
      }

      const rows = payload.result?.[0]?.results?.rows ?? [];

      // `get` asks for one row, not a list of them.
      return { rows: method === "get" ? (rows[0] ?? []) : rows };
    },
    { schema },
  );
}

import { createClient } from "@libsql/client";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { getCloudflareEnv } from "../cloudflare-env.server";
import { createD1HttpDb, readD1HttpCredentials } from "./d1-http.server";
import * as schema from "./schema";

// All three drivers are SQLite underneath and expose the same query builder; they differ only
// in the driver-level result type, which no caller touches.
export type Db = BaseSQLiteDatabase<"async", unknown, typeof schema>;

// The HTTP client holds no connection, but it does hold a fetch closure — build it once
// rather than per request.
let d1HttpDb: Db | undefined;

// Must be called inside a server function handler, never at module scope: the D1 binding
// only exists once a request is in flight (see cloudflare-env.server.ts).
export function getDb(): Db {
  // Deployed on Workers: the binding is a direct, in-datacenter path to D1. Always prefer it.
  const d1 = getCloudflareEnv()?.DB;
  if (d1) {
    return drizzleD1(d1, { schema }) as unknown as Db;
  }

  // Local `vite dev` runs on Node, where no binding exists. With Cloudflare credentials set,
  // talk to the same remote D1 over its HTTP API — local dev then reads and writes the
  // PRODUCTION database. See d1-http.server.ts.
  const credentials = readD1HttpCredentials();
  if (credentials) {
    d1HttpDb ??= createD1HttpDb(credentials) as unknown as Db;
    return d1HttpDb;
  }

  // No binding and no credentials: fall back to a local SQLite file.
  const client = createClient({ url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db" });
  return drizzleLibsql(client, { schema }) as unknown as Db;
}

import { createClient } from "@libsql/client";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { getCloudflareEnv } from "../cloudflare-env.server";
import * as schema from "./schema";

// Both drivers are SQLite underneath and expose the same query builder; they differ only
// in the driver-level result type, which no caller touches.
export type Db = BaseSQLiteDatabase<"async", unknown, typeof schema>;

// Must be called inside a server function handler, never at module scope: the D1 binding
// only exists once a request is in flight (see cloudflare-env.server.ts).
export function getDb(): Db {
  const d1 = getCloudflareEnv()?.DB;
  if (d1) {
    return drizzleD1(d1, { schema }) as unknown as Db;
  }

  // Local `vite dev` runs on Node with no Workers binding: fall back to a SQLite file.
  const client = createClient({ url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db" });
  return drizzleLibsql(client, { schema }) as unknown as Db;
}

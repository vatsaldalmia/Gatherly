import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Must be called inside a server function handler, never at module scope.
// CF Workers bind process.env at request time, not module load time.
export function getDb() {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof getDb>;

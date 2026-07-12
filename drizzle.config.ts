import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

// D1 is SQLite, so one dialect covers both targets:
//   local dev  -> `drizzle-kit push` against the dev.db file
//   production -> `drizzle-kit generate`, then apply the SQL to D1 with
//                 `wrangler d1 execute <db> --remote --file=...` (see DEPLOY.md)
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: { url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db" },
} satisfies Config;

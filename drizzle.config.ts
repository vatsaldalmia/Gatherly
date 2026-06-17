import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
const isLocalFile = url.startsWith("file:");

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: isLocalFile ? "sqlite" : "turso",
  dbCredentials: isLocalFile
    ? { url }
    : { url, authToken: process.env.TURSO_AUTH_TOKEN! },
} satisfies Config;

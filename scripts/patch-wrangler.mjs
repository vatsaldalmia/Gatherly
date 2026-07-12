// Nitro regenerates .output/server/wrangler.json on every build and offers no hook for
// declaring bindings, so we merge ours in afterwards. Runs as part of `bun run build`.
// The D1 ids below are not secrets — they are the same values a committed wrangler.toml
// would carry.
import { readFile, writeFile } from "node:fs/promises";

const CONFIG_PATH = new URL("../.output/server/wrangler.json", import.meta.url);

// Nitro derives the worker name from the git remote (vatsaldalmia-plan-together), which
// is the old project name and would become the public URL. Pin it.
const WORKER_NAME = "gatherly";

// Nitro stamps compatibility_date with today's *local* date, which Cloudflare rejects as
// "in the future" whenever the local clock is ahead of UTC. Pin it: a compat date should
// be a deliberate, stable choice anyway, not whenever you happened to build.
// Must stay >= 2024-09-23 for nodejs_compat v2.
const COMPATIBILITY_DATE = "2026-07-01";

const D1_BINDING = {
  binding: "DB", // read as env.DB — see src/lib/cloudflare-env.server.ts
  database_name: "gatherly",
  database_id: process.env.D1_DATABASE_ID ?? "b72277cd-24d1-40f1-862f-2874482bf31a",
};

const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));

config.name = WORKER_NAME;
config.compatibility_date = COMPATIBILITY_DATE;
config.d1_databases = [D1_BINDING];
config.observability = { enabled: true };

await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
console.log(
  `✓ patched wrangler.json: name "${config.name}", D1 "${D1_BINDING.binding}" -> ${D1_BINDING.database_name}`,
);

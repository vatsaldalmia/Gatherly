import type { D1Database } from "@cloudflare/workers-types";

export type CloudflareEnv = {
  DB?: D1Database;
};

// Nitro's cloudflare-module preset does NOT forward `env` to the server entry's fetch —
// it assigns `globalThis.__env__ = env` on every invocation instead. Bindings are objects,
// so unlike plain secrets they never show up on process.env; this global is the only way
// to reach them. Undefined under `vite dev`, which runs on Node with no Workers env.
export function getCloudflareEnv(): CloudflareEnv | undefined {
  return (globalThis as { __env__?: CloudflareEnv }).__env__;
}

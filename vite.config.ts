// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type Plugin } from "vite";

// Vite reads .env but only ever surfaces VITE_* vars, and only to the client via
// import.meta.env — it never writes to process.env. Server code (getDb, better-auth) reads
// process.env, which under `vite dev` carries just the shell's own vars, so server entries in
// .env would silently read as undefined. On Workers these arrive as secrets/bindings; in dev
// they have to be loaded. `serve` only — a build must never bake .env into the bundle.
function loadServerEnv(): Plugin {
  return {
    name: "gatherly:load-server-env",
    apply: "serve",
    config(_config, { mode }) {
      for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ""))) {
        process.env[key] ??= value; // a real shell var always wins over .env
      }
    },
  };
}

export default defineConfig({
  plugins: [loadServerEnv()],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Force Nitro on: it otherwise only auto-enables inside a Lovable sandbox, so a
  // self-hosted `bun run build` would emit no Worker at all.
  // Nitro regenerates .output/server/wrangler.json every build and gives us no way to
  // declare bindings, so scripts/patch-wrangler.mjs merges the D1 binding in afterwards.
  nitro: {
    preset: "cloudflare-module",
    cloudflare: { nodeCompat: true, deployConfig: true },
  },
});

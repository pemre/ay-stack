/// <reference types="vitest" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import burkutContent from "./vite-plugins/burkut-content.ts";
// Imported by path, not as "@ay/vite-config": Vite 5's config loader
// unconditionally externalizes bare specifiers, so Node would be handed a raw
// .ts file and fail with ERR_UNKNOWN_FILE_EXTENSION. A relative specifier is
// bundled by esbuild instead. Same module, same single source of truth for the
// alias map — only the import form differs.
import { ayResolve } from "../../packages/vite-config/src/index.ts";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

/**
 * Minimal Vite plugin that serves /api/layouts during `pnpm dev`.
 *
 * Pinned to the package directory rather than `process.cwd()`: in a workspace,
 * running the dev server from the monorepo root would otherwise read and write
 * layouts at the root instead of in `apps/burkut/`. This is the repo-local dev
 * counterpart of the CLI plugin's content-directory API, which keeps using
 * `contentDir` and is untouched.
 */
function devLayoutsApi(): Plugin {
  const layoutsDir = join(import.meta.dirname, ".burkut", "layouts");
  const filePath = join(layoutsDir, "dashboard.json");

  return {
    name: "burkut-dev-layouts-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/api/layouts") return next();

        if (req.method === "GET") {
          if (!existsSync(filePath)) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }
          try {
            const data = readFileSync(filePath, "utf-8");
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(data);
          } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Failed to read layouts" }));
          }
          return;
        }

        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          req.on("data", (chunk: Buffer) => chunks.push(chunk));
          req.on("end", () => {
            try {
              const body = Buffer.concat(chunks).toString("utf-8");
              mkdirSync(layoutsDir, { recursive: true });
              writeFileSync(filePath, body, "utf-8");
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
            } catch {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Failed to write layouts" }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

/**
 * Content directory for the repo-local `vite build` / `vite dev` runs.
 *
 * `BURKUT_CONTENT_DIR` is resolved against the caller's working directory, the
 * same rule the CLI applies to its `burkut serve <dir>` argument. When it is
 * unset the plugin serves an empty ContentGraph and says so on stdout, so a
 * blank UI is explained rather than mysterious.
 *
 * The empty-graph fallback is a build-unblocking measure, NOT the ROADMAP
 * Phase 6 static-build feature. Nothing here exports content or prerenders.
 */
const contentDir = process.env.BURKUT_CONTENT_DIR
  ? resolve(process.cwd(), process.env.BURKUT_CONTENT_DIR)
  : undefined;

export default defineConfig({
  // Explicit so a root-level invocation cannot drift to the workspace root.
  root: import.meta.dirname,
  base: process.env.GITHUB_PAGES ? "/ay-stack/burkut/" : "/",
  // react-draggable (a react-grid-layout dependency) reads
  // `process.env.DRAGGABLE_DEBUG` inside its drag-start handler. Vite doesn't
  // polyfill `process` for the browser, so without this the reference throws
  // `process is not defined`, the drag-start handler aborts, and widgets can
  // no longer be dragged or resized.
  define: {
    "process.env": {},
  },
  plugins: [
    tailwindcss(),
    react(),
    devLayoutsApi(),
    burkutContent({ contentDir, yieldToInlineInstance: true }),
  ],
  resolve: {
    ...ayResolve(),
  },
  server: {
    // devLayoutsApi() writes .burkut/layouts/dashboard.json on every
    // POST /api/layouts (triggered by the persistence middleware whenever
    // dashboard state changes). Without this exclusion, Vite's watcher sees
    // that write and issues a full reload, which re-hydrates from the
    // server and can trigger another persist — a reload loop.
    watch: {
      ignored: ["**/.burkut/**"],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    css: true,
    setupFiles: "./src/tests/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "vite-plugins/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});

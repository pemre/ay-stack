import type { Plugin } from "vite";
import { scanDirectory } from "../src/cli/scanner.ts";
import { buildContentGraph } from "../src/cli/contentGraph.ts";
import type { ContentGraph } from "../src/shared/types.ts";
import { resolve, normalize, extname, join } from "node:path";
import {
  createReadStream,
  existsSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";

export const VIRTUAL_ID = "virtual:burkut-content";
export const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const CONTENT_ASSETS_PREFIX = "/content-assets/";

/** Simple extension → MIME type map for serving media files. */
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".md": "text/markdown",
  ".mdx": "text/markdown",
  ".markdown": "text/markdown",
};

/**
 * Check whether a requested path resolves within the content directory boundary.
 * Used to prevent path traversal attacks on `/content-assets/` requests.
 *
 * @param contentDir - Absolute path to the content directory
 * @param requestedPath - The relative path from the request (after stripping the prefix)
 * @returns true if the resolved path is within the content directory
 */
export function isPathWithinBoundary(contentDir: string, requestedPath: string): boolean {
  const normalizedBase = normalize(contentDir);
  const resolved = resolve(contentDir, requestedPath);
  const normalizedResolved = normalize(resolved);
  return (
    normalizedResolved.startsWith(normalizedBase + "/") || normalizedResolved === normalizedBase
  );
}

interface BurkutContentPluginOptions {
  /**
   * Absolute path to the content directory. When omitted the plugin serves an
   * empty ContentGraph instead of scanning — see `emptyGraphPlugin` below.
   */
  contentDir?: string;
  /**
   * Set by the app's own `vite.config.ts`. Vite orders config-file plugins ahead
   * of plugins passed inline to `createServer`, so without this the config-file
   * instance would shadow the one the CLI registers for `burkut serve <dir>`.
   * With it, any inline instance wins and the CLI path behaves exactly as it did
   * before this plugin was registered in the config file at all.
   */
  yieldToInlineInstance?: boolean;
}

/** The plugin name used by the scanning (contentDir-bearing) instance. */
const PLUGIN_NAME = "vite-plugin-burkut-content";

/** The plugin name used by the empty-graph fallback instance. */
const FALLBACK_PLUGIN_NAME = "vite-plugin-burkut-content-fallback";

/** A ContentGraph with no nodes — the shape `buildContentGraph` returns for no files. */
export function emptyContentGraph(): ContentGraph {
  return buildContentGraph([], "");
}

/**
 * Fallback instance used when no content directory is configured, so that
 * `virtual:burkut-content` still resolves and `vite build` / `vite dev` work
 * out of the box in the repository.
 *
 * This is **not** the ROADMAP Phase 6 static-build feature. It resolves the
 * virtual module to an empty graph so the app boots with no content; it does
 * not export content, copy assets, or prerender anything.
 *
 * It scans nothing, watches nothing, and registers no middleware. If a
 * scanning instance is also present — the CLI path registers one inline, and
 * config-file plugins are ordered ahead of inline ones — this instance goes
 * inert so the CLI's real graph is the one that gets served.
 */
function emptyGraphPlugin(): Plugin {
  let inert = false;

  return {
    name: FALLBACK_PLUGIN_NAME,

    configResolved(config) {
      inert = config.plugins.some((plugin) => plugin.name === PLUGIN_NAME);
      if (inert) return;
      console.log(
        "[burkut] No content directory configured — serving an empty content graph. " +
          "Set BURKUT_CONTENT_DIR to point at a content directory.",
      );
    },

    resolveId(id: string) {
      if (inert) return;
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id: string) {
      if (inert) return;
      if (id !== RESOLVED_ID) return;
      return `export default ${JSON.stringify(emptyContentGraph())};`;
    },
  };
}

/**
 * Vite plugin that scans a content directory, builds a ContentGraph, and serves it
 * as a virtual module (`virtual:burkut-content`). Also serves media files from the
 * content directory via a `/content-assets/` URL prefix middleware.
 *
 * In dev mode, watches the content directory for changes and triggers HMR updates.
 */
export default function burkutContent(options: BurkutContentPluginOptions = {}): Plugin {
  if (options.contentDir === undefined) return emptyGraphPlugin();
  // Bound to a typed local so the hoisted helpers below keep the narrowed type.
  const contentDir: string = options.contentDir;
  let graph: ContentGraph;
  let deferred = false;

  function rebuildGraph(): void {
    const files = scanDirectory(contentDir);
    graph = buildContentGraph(files, contentDir);
  }

  const plugin: Plugin = {
    name: PLUGIN_NAME,

    configResolved(config) {
      if (!options.yieldToInlineInstance) return;
      // Counted rather than compared by identity: Vite normalizes plugin objects
      // during config resolution, so `config.plugins` need not hold this exact
      // reference. More than one instance means an inline one is present.
      deferred = config.plugins.filter((other) => other.name === PLUGIN_NAME).length > 1;
    },

    buildStart() {
      if (deferred) return;
      rebuildGraph();
    },

    resolveId(id: string) {
      if (deferred) return;
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id: string) {
      if (deferred) return;
      if (id !== RESOLVED_ID) return;
      return `export default ${JSON.stringify(graph)};`;
    },

    configureServer(server) {
      if (deferred) return;
      // Initial scan
      rebuildGraph();

      // Watch content directory for changes
      server.watcher.add(contentDir);
      server.watcher.on("all", (_event, filePath) => {
        if (filePath.startsWith(contentDir)) {
          rebuildGraph();
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: "full-reload" });
          }
        }
      });

      // Middleware to serve media files from the content directory
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith(CONTENT_ASSETS_PREFIX)) {
          return next();
        }

        const relativePath = decodeURIComponent(req.url.slice(CONTENT_ASSETS_PREFIX.length));

        // Validate path traversal
        if (!isPathWithinBoundary(contentDir, relativePath)) {
          res.statusCode = 403;
          res.end("Forbidden: path traversal detected");
          return;
        }

        const absolutePath = resolve(contentDir, relativePath);

        if (!existsSync(absolutePath)) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }

        const stat = statSync(absolutePath);
        if (!stat.isFile()) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }

        const ext = extname(absolutePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Length", stat.size);
        createReadStream(absolutePath).pipe(res);
      });

      // REST endpoint: GET /api/layouts
      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET" || req.url !== "/api/layouts") {
          return next();
        }

        const filePath = join(contentDir, ".burkut", "layouts", "dashboard.json");

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
      });

      // REST endpoint: POST /api/layouts
      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || req.url !== "/api/layouts") {
          return next();
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf-8");
            const layoutsDir = join(contentDir, ".burkut", "layouts");
            mkdirSync(layoutsDir, { recursive: true });
            writeFileSync(join(layoutsDir, "dashboard.json"), body, "utf-8");
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Failed to write layouts" }));
          }
        });
      });
    },
  };

  return plugin;
}

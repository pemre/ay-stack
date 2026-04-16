import type { Plugin } from "vite";
import { scanDirectory } from "../src/cli/scanner.ts";
import { buildContentGraph } from "../src/cli/contentGraph.ts";
import type { ContentGraph } from "../src/shared/types.ts";
import { resolve, normalize, extname } from "node:path";
import { createReadStream, existsSync, statSync } from "node:fs";

const VIRTUAL_ID = "virtual:burkut-content";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
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
        normalizedResolved.startsWith(normalizedBase + "/") ||
        normalizedResolved === normalizedBase
    );
}

interface BurkutContentPluginOptions {
    /** Absolute path to the content directory */
    contentDir: string;
}

/**
 * Vite plugin that scans a content directory, builds a ContentGraph, and serves it
 * as a virtual module (`virtual:burkut-content`). Also serves media files from the
 * content directory via a `/content-assets/` URL prefix middleware.
 *
 * In dev mode, watches the content directory for changes and triggers HMR updates.
 */
export default function burkutContent(options: BurkutContentPluginOptions): Plugin {
    const { contentDir } = options;
    let graph: ContentGraph;

    function rebuildGraph(): void {
        const files = scanDirectory(contentDir);
        graph = buildContentGraph(files, contentDir);
    }

    return {
        name: "vite-plugin-burkut-content",

        buildStart() {
            rebuildGraph();
        },

        resolveId(id: string) {
            if (id === VIRTUAL_ID) return RESOLVED_ID;
        },

        load(id: string) {
            if (id !== RESOLVED_ID) return;
            return `export default ${JSON.stringify(graph)};`;
        },

        configureServer(server) {
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

                const relativePath = decodeURIComponent(
                    req.url.slice(CONTENT_ASSETS_PREFIX.length),
                );

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
        },
    };
}

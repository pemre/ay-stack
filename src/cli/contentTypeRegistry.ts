import path from "node:path";
import type { ContentType, ContentTypeDefinition } from "../shared/types.ts";

export const CONTENT_TYPE_REGISTRY: ContentTypeDefinition[] = [
    { type: "markdown", extensions: [".md", ".mdx", ".markdown"], mimePrefix: "text/markdown" },
    {
        type: "image",
        extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"],
        mimePrefix: "image/",
    },
    { type: "video", extensions: [".mp4", ".webm", ".mov", ".avi"], mimePrefix: "video/" },
    { type: "audio", extensions: [".mp3", ".wav", ".ogg", ".flac", ".m4a"], mimePrefix: "audio/" },
];

/**
 * Detect the content type of a file based on its extension.
 * Case-insensitive matching. Returns null for unrecognized extensions.
 */
export function detectContentType(filePath: string): ContentType | null {
    const ext = path.extname(filePath).toLowerCase();
    for (const def of CONTENT_TYPE_REGISTRY) {
        if (def.extensions.includes(ext)) {
            return def.type;
        }
    }
    return null;
}

/**
 * Get the full content type definition for a given content type.
 * Throws if the type is not registered.
 */
export function getDefinition(type: ContentType): ContentTypeDefinition {
    const def = CONTENT_TYPE_REGISTRY.find((d) => d.type === type);
    if (!def) {
        throw new Error(`Unknown content type: ${type}`);
    }
    return def;
}

import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createServer } from "vite";
import burkutContent from "../../vite-plugins/burkut-content.ts";
import type { BurkutConfig, CLIOptions } from "../shared/types.ts";

const DEFAULT_CONFIG: BurkutConfig = {};

async function loadWorkspaceConfig(targetDir: string): Promise<BurkutConfig> {
    const configPath = join(targetDir, ".burkut", "config.ts");
    if (!existsSync(configPath)) return DEFAULT_CONFIG;

    try {
        const mod = await import(configPath);
        return { ...DEFAULT_CONFIG, ...(mod.default as BurkutConfig) };
    } catch {
        console.warn("Warning: Could not load workspace config, using defaults");
        return DEFAULT_CONFIG;
    }
}

function isDirectoryEmpty(dir: string): boolean {
    try {
        const entries = readdirSync(dir);
        return entries.length === 0;
    } catch {
        return true;
    }
}

export async function startDevServer(targetDir: string, options: CLIOptions): Promise<void> {
    const config = await loadWorkspaceConfig(targetDir);

    if (options.host === "0.0.0.0") {
        console.warn(
            "⚠ Warning: Server is exposed to the network. Content files will be accessible to other devices.",
        );
    }

    if (isDirectoryEmpty(targetDir)) {
        console.log(
            "No content files found. Add markdown, image, video, or audio files to get started.",
        );
    }

    const projectRoot = resolve(import.meta.dirname, "../..");

    const server = await createServer({
        root: projectRoot,
        configFile: resolve(projectRoot, "vite.config.ts"),
        plugins: [burkutContent({ contentDir: targetDir })],
        server: {
            port: options.port,
            host: options.host,
            open: options.open,
        },
        ...((config.title || config.locale) && {
            define: {
                __BURKUT_WORKSPACE_TITLE__: JSON.stringify(config.title ?? ""),
                __BURKUT_WORKSPACE_LOCALE__: JSON.stringify(config.locale ?? ""),
            },
        }),
    });

    await server.listen();
    server.printUrls();
}

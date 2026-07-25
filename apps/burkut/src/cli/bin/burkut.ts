#!/usr/bin/env node
import cac from "cac";
import { resolveTargetDir, validateTargetDir } from "../paths.ts";

const cli = cac("burkut");

cli
  .command("serve [directory]", "Start the development server")
  .option("--port <port>", "Port number", { default: 5173 })
  .option("--host <host>", "Host address", { default: "localhost" })
  .option("--open", "Open browser on start", { default: false })
  .action(async (directory: string | undefined, options: Record<string, unknown>) => {
    const targetDir = resolveTargetDir(process.cwd(), directory);

    const problem = validateTargetDir(targetDir);
    if (problem !== null) {
      console.error(problem);
      process.exit(1);
    }

    const { startDevServer } = await import("../devServer.ts");
    await startDevServer(targetDir, {
      port: Number(options.port),
      host: options.host as string,
      open: options.open as boolean,
    });
  });

cli.command("build [directory]", "Build for production").action(() => {
  console.log("Static build is not yet implemented. Coming in a future release.");
  process.exit(0);
});

cli.help();
cli.version("0.1.0");
cli.parse();

#!/usr/bin/env node
/**
 * src/metrics.js
 *
 * Metrics dispatcher. Routes metrics subcommands to scripts under
 * metrics/commands/.
 */

import path from "path";
import { PKG_DIR } from "./lib/cli.js";
import { EXIT_ERROR } from "./lib/exit-codes.js";

const SCRIPTS = {
  token: "metrics/commands/token.js",
};

const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  console.error("Usage: sdd-forge metrics <command>\n");
  console.error("Available commands:");
  for (const c of Object.keys(SCRIPTS)) console.error(`  ${c}`);
  console.error("\nRun: sdd-forge metrics <command> --help");
  process.exit(subCmd ? 0 : EXIT_ERROR);
}

const scriptRelPath = SCRIPTS[subCmd];
if (!scriptRelPath) {
  console.error(`sdd-forge metrics: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge metrics --help");
  process.exit(EXIT_ERROR);
}

const scriptPath = path.join(PKG_DIR, scriptRelPath);
process.argv = [process.argv[0], scriptPath, ...rest];
await import(scriptPath);

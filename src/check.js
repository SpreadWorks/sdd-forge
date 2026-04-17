#!/usr/bin/env node
/**
 * src/check.js
 *
 * Check dispatcher. Routes check subcommands to scripts under check/commands/.
 */

import path from "path";
import { PKG_DIR } from "./lib/cli.js";
import { EXIT_ERROR } from "./lib/constants.js";

/** Subcommand → script mapping */
const SCRIPTS = {
  config: "check/commands/config.js",
  freshness: "check/commands/freshness.js",
  scan: "check/commands/scan.js",
};

const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  console.error("Usage: sdd-forge check <command>\n");
  console.error("Available commands:");
  for (const c of Object.keys(SCRIPTS)) console.error(`  ${c}`);
  console.error("\nRun: sdd-forge check <command> --help");
  process.exit(subCmd ? 0 : 1);
}

const scriptRelPath = SCRIPTS[subCmd];
if (!scriptRelPath) {
  console.error(`sdd-forge check: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge check --help");
  process.exit(EXIT_ERROR);
}

const scriptPath = path.join(PKG_DIR, scriptRelPath);
process.argv = [process.argv[0], scriptPath, ...rest];

await import(scriptPath);

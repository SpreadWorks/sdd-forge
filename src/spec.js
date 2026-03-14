#!/usr/bin/env node
/**
 * src/spec.js
 *
 * Spec dispatcher. Routes spec-related subcommands.
 */

import path from "path";
import { PKG_DIR } from "./lib/cli.js";

const SCRIPTS = {
  init:      "spec/commands/init.js",
  gate:      "spec/commands/gate.js",
  guardrail: "spec/commands/guardrail.js",
};

const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

// No subcommand → show available subcommands
if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  console.error("Usage: sdd-forge spec <command>\n");
  console.error("Available commands:");
  for (const c of Object.keys(SCRIPTS)) console.error(`  ${c}`);
  console.error("\nRun: sdd-forge spec <command> --help");
  process.exit(subCmd ? 0 : 1);
}

const scriptRelPath = SCRIPTS[subCmd];
if (!scriptRelPath) {
  console.error(`sdd-forge spec: unknown command '${subCmd}'`);
  process.exit(1);
}

const scriptPath = path.join(PKG_DIR, scriptRelPath);
process.argv = [process.argv[0], scriptPath, ...rest];

await import(scriptPath);

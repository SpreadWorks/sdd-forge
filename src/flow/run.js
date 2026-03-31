#!/usr/bin/env node
/**
 * src/flow/run.js
 *
 * Second-level dispatcher for `flow run <action>`.
 */

import path from "path";
import { PKG_DIR } from "../lib/cli.js";
import { FLOW_COMMANDS } from "./registry.js";
import { EXIT_ERROR } from "../lib/exit-codes.js";

const KEYS = FLOW_COMMANDS.run.keys;

const args = process.argv.slice(2);
const action = args[0];
const rest = args.slice(1);

if (!action || action === "-h" || action === "--help") {
  const lines = ["Usage: sdd-forge flow run <action> [options]", "", "Actions:"];
  for (const [name, entry] of Object.entries(KEYS)) {
    lines.push(`  ${name.padEnd(18)} ${entry.desc.en}`);
  }
  console.log(lines.join("\n"));
  if (!action) process.exit(EXIT_ERROR);
  process.exit(0);
}

const entry = KEYS[action];
if (!entry) {
  console.error(`sdd-forge flow run: unknown action '${action}'`);
  console.error("Run: sdd-forge flow run --help");
  process.exit(EXIT_ERROR);
}

const scriptPath = path.join(PKG_DIR, entry.script);
process.argv = [process.argv[0], scriptPath, ...rest];

await import(scriptPath);

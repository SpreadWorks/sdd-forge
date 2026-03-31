#!/usr/bin/env node
/**
 * src/flow/get.js
 *
 * Second-level dispatcher for `flow get <key>`.
 */

import path from "path";
import { PKG_DIR } from "../lib/cli.js";
import { FLOW_COMMANDS } from "./registry.js";
import { EXIT_ERROR } from "../lib/exit-codes.js";

const KEYS = FLOW_COMMANDS.get.keys;

const args = process.argv.slice(2);
const key = args[0];
const rest = args.slice(1);

if (!key || key === "-h" || key === "--help") {
  const lines = ["Usage: sdd-forge flow get <key> [options]", "", "Keys:"];
  for (const [name, entry] of Object.entries(KEYS)) {
    lines.push(`  ${name.padEnd(18)} ${entry.desc.en}`);
  }
  console.log(lines.join("\n"));
  if (!key) process.exit(EXIT_ERROR);
  process.exit(0);
}

const entry = KEYS[key];
if (!entry) {
  console.error(`sdd-forge flow get: unknown key '${key}'`);
  console.error("Run: sdd-forge flow get --help");
  process.exit(EXIT_ERROR);
}

const scriptPath = path.join(PKG_DIR, entry.script);
process.argv = [process.argv[0], scriptPath, ...rest];

await import(scriptPath);

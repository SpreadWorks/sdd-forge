#!/usr/bin/env node
/**
 * src/flow.js
 *
 * Flow dispatcher. Routes to get/set/run sub-dispatchers.
 */

import path from "path";
import { PKG_DIR } from "./lib/cli.js";
import { FLOW_COMMANDS } from "./flow/registry.js";
import { EXIT_ERROR } from "./lib/exit-codes.js";

const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  const lines = [
    "Usage: sdd-forge flow <get|set|run> <key> [options]",
    "",
    "Subcommands:",
  ];
  for (const [name, cmd] of Object.entries(FLOW_COMMANDS)) {
    lines.push(`  ${name.padEnd(8)} ${cmd.desc.en}`);
  }
  lines.push("", "Examples:");
  lines.push("  sdd-forge flow get status");
  lines.push("  sdd-forge flow set step approach done");
  lines.push("  sdd-forge flow run merge --auto");
  console.log(lines.join("\n"));
  if (!subCmd) process.exit(EXIT_ERROR);
  process.exit(0);
}

const entry = FLOW_COMMANDS[subCmd];
if (!entry) {
  console.error(`sdd-forge flow: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge flow --help");
  process.exit(EXIT_ERROR);
}

const scriptPath = path.join(PKG_DIR, entry.script);
process.argv = [process.argv[0], scriptPath, ...rest];

await import(scriptPath);

#!/usr/bin/env node
/**
 * src/flow.js
 *
 * Flow dispatcher. Routes flow subcommands.
 *   start  → flow/commands/start.js
 *   status → flow/commands/status.js
 */

import path from "path";
import { PKG_DIR } from "./lib/cli.js";

const SCRIPTS = {
  start:  "flow/commands/start.js",
  status: "flow/commands/status.js",
  review: "flow/commands/review.js",
};

const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

// --help / -h at top level
if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  console.log(
    [
      "Usage: sdd-forge flow <subcommand> [options]",
      "",
      "Subcommands:",
      "  start   Run SDD flow (spec → gate → forge)",
      "  status  Display or update flow progress",
      "  review  Run code quality review (draft → final → apply)",
      "",
      "Examples:",
      '  sdd-forge flow start --request "add login feature"',
      "  sdd-forge flow status",
      "  sdd-forge flow status --step gate --status done",
    ].join("\n"),
  );
  if (!subCmd) process.exit(1);
  process.exit(0);
}

const scriptRelPath = SCRIPTS[subCmd];
if (!scriptRelPath) {
  console.error(`sdd-forge flow: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge flow --help");
  process.exit(1);
}

const scriptPath = path.join(PKG_DIR, scriptRelPath);
process.argv = [process.argv[0], scriptPath, ...rest];

await import(scriptPath);

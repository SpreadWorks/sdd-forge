#!/usr/bin/env node
/**
 * src/sdd-forge.js
 *
 * sdd-forge CLI entry point.
 * Routes top-level subcommands to dedicated dispatchers:
 *   docs  → src/docs.js
 *   spec  → src/spec.js
 *   flow  → src/flow.js
 *   help  → src/help.js
 */

import path from "path";
import { PKG_DIR } from "./lib/cli.js";

const rawArgs = process.argv.slice(2);
const [subCmd, ...rest] = rawArgs;

// version (-v / --version / -V)
if (subCmd === "-v" || subCmd === "--version" || subCmd === "-V") {
  const { getPackageVersion } = await import("./lib/cli.js");
  console.log(getPackageVersion());
  process.exit(0);
}

// help (no args / -h / --help)
if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  const helpPath = path.join(PKG_DIR, "help.js");
  process.argv = [process.argv[0], helpPath];
  await import(helpPath);
  process.exit(0);
}

/** Map of top-level subcommands to dispatcher scripts */
const DISPATCHERS = {
  // docs subcommands → docs.js dispatcher
  build:    "docs",
  scan:     "docs",
  init:     "docs",
  data:     "docs",
  text:     "docs",
  readme:   "docs",
  forge:    "docs",
  review:   "docs",
  changelog: "docs",
  agents:   "docs",
  upgrade:  "docs",
  translate: "docs",
  snapshot: "docs",
  setup:    "docs",
  // spec subcommands → spec.js dispatcher
  spec:     "spec",
  gate:     "spec",
  guardrail: "spec",
  // flow → flow.js
  flow:     "flow",
  // presets → presets-cmd.js
  presets:  "presets-cmd",
  // help
  help:     "help",
};

const dispatcherName = DISPATCHERS[subCmd];
if (!dispatcherName) {
  console.error(`sdd-forge: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge help");
  process.exit(1);
}

const dispatcherPath = path.join(PKG_DIR, `${dispatcherName}.js`);

// Dispatchers (docs, spec) receive subCmd to route internally.
// Direct commands (flow, presets-cmd) receive only rest args — flow dispatches internally.
const DIRECT_COMMANDS = new Set(["flow", "presets-cmd"]);
if (DIRECT_COMMANDS.has(dispatcherName)) {
  process.argv = [process.argv[0], dispatcherPath, ...rest];
} else {
  process.argv = [process.argv[0], dispatcherPath, subCmd, ...rest];
}

await import(dispatcherPath);

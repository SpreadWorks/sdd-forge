#!/usr/bin/env node
/**
 * src/sdd-forge.js
 *
 * sdd-forge CLI entry point.
 * Routes top-level subcommands to dedicated dispatchers:
 *   docs    → src/docs.js
 *   spec    → src/spec.js
 *   flow    → src/flow.js
 *   setup   → src/setup.js
 *   upgrade → src/upgrade.js
 *   help    → src/help.js
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

/** Namespace dispatchers — receive subcommand + rest args */
const NAMESPACE_DISPATCHERS = new Set(["docs", "spec", "flow"]);

/** Independent commands — receive rest args directly */
const INDEPENDENT = {
  setup:   "setup",
  upgrade: "upgrade",
  presets: "presets-cmd",
  help:    "help",
};

if (NAMESPACE_DISPATCHERS.has(subCmd)) {
  const dispatcherPath = path.join(PKG_DIR, `${subCmd}.js`);
  process.argv = [process.argv[0], dispatcherPath, ...rest];
  await import(dispatcherPath);
} else if (INDEPENDENT[subCmd]) {
  const scriptPath = path.join(PKG_DIR, `${INDEPENDENT[subCmd]}.js`);
  process.argv = [process.argv[0], scriptPath, ...rest];
  await import(scriptPath);
} else {
  console.error(`sdd-forge: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge help");
  process.exit(1);
}

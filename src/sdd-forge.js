#!/usr/bin/env node
/**
 * src/sdd-forge.js
 *
 * sdd-forge CLI entry point.
 * Routes top-level subcommands to dedicated dispatchers:
 *   docs    → src/docs.js
 *   flow    → src/flow.js
 *   check   → src/check.js
 *   setup   → src/setup.js
 *   upgrade → src/upgrade.js
 *   help    → src/help.js
 */

import { register } from "node:module";
import path from "path";
import { PKG_DIR, repoRoot } from "./lib/cli.js";
import { EXIT_ERROR } from "./lib/exit-codes.js";
import { Logger } from "./lib/log.js";

// Register module loader hook so external presets can use `import 'sdd-forge/api'`
register(new URL("./loader.js", import.meta.url), import.meta.url);

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

// Initialize Logger singleton (best-effort — config may not exist yet)
try {
  const { loadConfig, sddConfigPath } = await import("./lib/config.js");
  const root = repoRoot();
  const cfg = loadConfig(root);
  const entryCommand = rawArgs.join(" ");
  // Deprecation warning: legacy cfg.logs.prompts → cfg.logs.enabled
  if (cfg?.logs?.prompts != null && cfg?.logs?.enabled == null) {
    process.stderr.write("[sdd-forge] WARN: cfg.logs.prompts is deprecated. Use cfg.logs.enabled instead.\n");
  }
  Logger.getInstance().init(root, cfg, { entryCommand });
  Logger.getInstance().event("config-loaded", { path: sddConfigPath(root), keys: Object.keys(cfg) });
} catch (err) {
  /* pre-setup or missing config — Logger stays uninitialized */
  if (err?.code !== "ERR_MISSING_FILE") process.stderr.write(`[sdd-forge] Logger init failed: ${err?.message}\n`);
}

/** Namespace dispatchers — receive subcommand + rest args */
const NAMESPACE_DISPATCHERS = new Set(["docs", "flow", "check"]);

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
  process.exit(EXIT_ERROR);
}

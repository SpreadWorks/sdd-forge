#!/usr/bin/env node
/**
 * src/sdd-forge.js
 *
 * sdd-forge CLI entry point.
 * Routes top-level subcommands to dedicated dispatchers:
 *   docs    → src/docs.js
 *   flow    → src/flow.js
 *   check   → src/check.js
 *   metrics → src/metrics.js
 *   setup   → src/setup.js
 *   upgrade → src/upgrade.js
 *   help    → src/help.js
 */

import { register } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "path";
import { PKG_DIR } from "./lib/cli.js";
import { runCmd } from "./lib/process.js";
import { EXIT_ERROR } from "./lib/constants.js";
import { initContainer } from "./lib/container.js";
import { runModuleMain } from "./lib/command-runner.js";

// Register module loader hook so external presets can use
//   `import 'sdd-forge/api'`                        (public API)
//   `import 'sdd-forge/presets/<name>/<subpath>'`   (3-tier preset cross-import)
//
// Pass the project root and user home to the loader so it can consult
// .sdd-forge/presets/ under either location before falling back to the
// built-in presets shipped inside this package.
//
// projectRoot is intentionally null when the current execution context has
// no determinable project (not inside a git repo and no SDD_FORGE_WORK_ROOT).
// In that case the loader skips the project-tier search entirely.
register(new URL("./loader.js", import.meta.url), import.meta.url, {
  data: {
    projectRoot: resolveProjectRoot(),
    userHome: os.homedir(),
  },
});

function resolveProjectRoot() {
  const envRoot = process.env.SDD_FORGE_WORK_ROOT;
  if (envRoot) {
    // Reject untrusted / malformed overrides at the entry point: the value
    // must be a non-empty string pointing at an actual directory. Anything
    // else falls back to git detection rather than silently trusting input.
    if (typeof envRoot === "string" && envRoot.trim() !== "") {
      const candidate = envRoot.trim();
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    }
  }
  const res = runCmd("git", ["rev-parse", "--show-toplevel"]);
  return res.ok ? res.stdout.trim() : null;
}

const rawArgs = process.argv.slice(2);
const [subCmd, ...rest] = rawArgs;

// version (-v / --version / -V)
if (subCmd === "-v" || subCmd === "--version" || subCmd === "-V") {
  const { getPackageVersion } = await import("./lib/cli.js");
  console.log(getPackageVersion());
  process.exit(0);
}

// help (no args / -h / --help / help [topic])
if (!subCmd || subCmd === "-h" || subCmd === "--help" || subCmd === "help") {
  initContainer({ entryCommand: rawArgs.join(" ") });
  const helpPath = path.join(PKG_DIR, "help.js");
  process.argv = [process.argv[0], helpPath, ...rest];
  const helpMod = await import(helpPath);
  if (typeof helpMod.main === "function") helpMod.main();
  process.exit(0);
}

// Initialize the shared dependency container once; dispatchers and commands
// below import `container` directly from ./lib/container.js.
initContainer({ entryCommand: rawArgs.join(" ") });

/** Namespace dispatchers — receive subcommand + rest args */
const NAMESPACE_SCRIPTS = {
  docs: "docs",
  flow: "flow",
  check: "check",
  metrics: "metrics",
};

/** Independent commands — receive rest args directly */
const INDEPENDENT = {
  setup:   "setup",
  upgrade: "upgrade",
  presets: "presets-cmd",
};

if (NAMESPACE_SCRIPTS[subCmd]) {
  const dispatcherPath = path.join(PKG_DIR, `${NAMESPACE_SCRIPTS[subCmd]}.js`);
  process.argv = [process.argv[0], dispatcherPath, ...rest];
  await import(dispatcherPath);
} else if (INDEPENDENT[subCmd]) {
  const scriptPath = path.join(PKG_DIR, `${INDEPENDENT[subCmd]}.js`);
  await runModuleMain(scriptPath, rest);
} else {
  console.error(`sdd-forge: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge help");
  process.exit(EXIT_ERROR);
}

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
 *
 * Project context (--project) is resolved here and passed via env vars.
 */

import { fileURLToPath } from "url";
import path from "path";

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

// --project flag extraction
const rawArgs = process.argv.slice(2);
let projectName;
let filteredArgs = rawArgs;

const projIdx = rawArgs.indexOf("--project");
if (projIdx !== -1) {
  projectName = rawArgs[projIdx + 1];
  filteredArgs = [
    ...rawArgs.slice(0, projIdx),
    ...rawArgs.slice(projIdx + 2),
  ];
}

const [subCmd, ...rest] = filteredArgs;

// version (-v / --version / -V)
if (subCmd === "-v" || subCmd === "--version" || subCmd === "-V") {
  const { readFileSync } = await import("fs");
  const pkg = JSON.parse(readFileSync(path.join(PKG_DIR, "..", "package.json"), "utf8"));
  console.log(pkg.version);
  process.exit(0);
}

// help (no args / -h / --help)
if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  const helpPath = path.join(PKG_DIR, "help.js");
  process.argv = [process.argv[0], helpPath];
  await import(helpPath);
  process.exit(0);
}

/** Commands that skip project context resolution */
const PROJECT_MGMT = new Set(["default", "help", "setup", "presets"]);

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
  setup:    "docs",
  default:  "docs",
  // spec subcommands → spec.js dispatcher
  spec:     "spec",
  gate:     "spec",
  // flow → flow.js
  flow:     "flow",
  // presets → presets-cmd.js
  presets:  "presets-cmd",
  // help
  help:     "help",
};

// Resolve project context (skip for management commands)
if (!PROJECT_MGMT.has(subCmd)) {
  const { resolveProject, workRootFor } = await import(
    path.join(PKG_DIR, "lib/projects.js")
  );
  try {
    const project = resolveProject(projectName);
    if (project) {
      process.env.SDD_SOURCE_ROOT = project.path;
      process.env.SDD_WORK_ROOT   = workRootFor(project.name);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

const dispatcherName = DISPATCHERS[subCmd];
if (!dispatcherName) {
  console.error(`sdd-forge: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge help");
  process.exit(1);
}

const dispatcherPath = path.join(PKG_DIR, `${dispatcherName}.js`);

// Dispatchers (docs, spec) receive subCmd to route internally.
// Direct commands (flow) receive only rest args.
const DIRECT_COMMANDS = new Set(["flow", "presets-cmd"]);
if (DIRECT_COMMANDS.has(dispatcherName)) {
  process.argv = [process.argv[0], dispatcherPath, ...rest];
} else {
  process.argv = [process.argv[0], dispatcherPath, subCmd, ...rest];
}

await import(dispatcherPath);

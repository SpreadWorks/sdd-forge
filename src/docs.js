#!/usr/bin/env node
/**
 * src/docs.js
 *
 * Docs dispatcher. Routes docs-related subcommands to scripts under docs/commands/.
 */

import { fileURLToPath } from "url";
import path from "path";

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

/** Subcommand → script mapping */
const SCRIPTS = {
  default:  "docs/commands/default-project.js",
  scan:     "docs/commands/scan.js",
  init:     "docs/commands/init.js",
  data:     "docs/commands/data.js",
  text:     "docs/commands/text.js",
  readme:   "docs/commands/readme.js",
  forge:    "docs/commands/forge.js",
  setup:    "docs/commands/setup.js",
  review:   "docs/commands/review.js",
  changelog: "docs/commands/changelog.js",
  agents:   "docs/commands/agents.js",
};

// Extract subcommand from argv (set by sdd-forge.js)
const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

// build: scan → init → data → text → readme pipeline
if (subCmd === "build") {
  const scanPath     = path.join(PKG_DIR, "docs/commands/scan.js");
  const initPath     = path.join(PKG_DIR, "docs/commands/init.js");
  const dataPath     = path.join(PKG_DIR, "docs/commands/data.js");
  const textPath     = path.join(PKG_DIR, "docs/commands/text.js");
  const readmePath   = path.join(PKG_DIR, "docs/commands/readme.js");

  const initArgs = rest.filter((a) => a === "--force");
  const otherArgs = rest.filter((a) => a !== "--force");

  // 1. scan
  process.argv = [process.argv[0], scanPath];
  await import(scanPath);

  // 2. init
  process.argv = [process.argv[0], initPath, ...initArgs];
  await import(initPath);

  // 3. data
  process.argv = [process.argv[0], dataPath];
  await import(dataPath);

  // 4. text
  const { loadJsonFile } = await import(path.join(PKG_DIR, "lib/config.js"));
  const workRoot = process.env.SDD_WORK_ROOT || process.cwd();
  let agentArgs = [];
  try {
    const cfg = loadJsonFile(path.join(workRoot, ".sdd-forge", "config.json"));
    const agentName = otherArgs.includes("--agent")
      ? otherArgs[otherArgs.indexOf("--agent") + 1]
      : cfg.defaultAgent;
    if (agentName) {
      agentArgs = ["--agent", agentName];
    }
  } catch (_) {
    // config unreadable — let text command handle the error
  }

  if (agentArgs.length > 0) {
    process.argv = [process.argv[0], textPath, ...agentArgs];
    await import(textPath);
  } else {
    console.error("[build] WARN: no defaultAgent configured, skipping text generation.");
    console.error("[build] Set 'defaultAgent' in config.json or use: sdd-forge text --agent <name>");
  }

  // 5. readme
  process.argv = [process.argv[0], readmePath];
  await import(readmePath);

  // 6. agents (template-based in build, AI requires explicit `sdd-forge agents`)
  const agentsPath = path.join(PKG_DIR, "docs/commands/agents.js");
  process.argv = [process.argv[0], agentsPath, "--template"];
  await import(agentsPath);

  process.exit(0);
}

// Regular subcommand dispatch
const scriptRelPath = SCRIPTS[subCmd];
if (!scriptRelPath) {
  console.error(`sdd-forge docs: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge help");
  process.exit(1);
}

const scriptPath = path.join(PKG_DIR, scriptRelPath);
process.argv = [process.argv[0], scriptPath, ...rest];

await import(scriptPath);

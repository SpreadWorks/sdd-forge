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
  upgrade:  "docs/commands/upgrade.js",
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

  const isVerbose = rest.includes("--verbose");
  const isDryRun = rest.includes("--dry-run");
  const initArgs = rest.filter((a) => a === "--force");
  const otherArgs = rest.filter((a) => a !== "--force" && a !== "--verbose" && a !== "--dry-run");

  const pipelineSteps = [
    { label: "scan", weight: 1 },
    { label: "init", weight: 1 },
    { label: "data", weight: 1 },
    { label: "text", weight: 3 },
    { label: "readme", weight: 1 },
    { label: "agents", weight: 1 },
  ];

  // Set up progress bar for the build pipeline
  const { createProgress } = await import(path.join(PKG_DIR, "lib/progress.js"));
  const progress = createProgress(pipelineSteps, { verbose: isVerbose });

  const dryRunArg = isDryRun ? ["--dry-run"] : [];

  // 1. scan (always runs — analysis.json is internal cache, not user-facing)
  progress.start("scan");
  process.argv = [process.argv[0], scanPath];
  await import(scanPath);
  progress.stepDone();

  // 2. init
  progress.start("init");
  process.argv = [process.argv[0], initPath, ...initArgs, ...dryRunArg];
  await import(initPath);
  progress.stepDone();

  // 3. data
  progress.start("data");
  process.argv = [process.argv[0], dataPath, ...dryRunArg];
  await import(dataPath);
  progress.stepDone();

  // 4. text
  progress.start("text");
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
    process.argv = [process.argv[0], textPath, ...agentArgs, ...dryRunArg];
    await import(textPath);
  } else {
    progress.log("[text] WARN: no defaultAgent configured, skipping text generation.");
    progress.log("[text] Set 'defaultAgent' in config.json or use: sdd-forge text --agent <name>");
  }
  progress.stepDone();

  // 5. readme
  progress.start("readme");
  process.argv = [process.argv[0], readmePath, ...dryRunArg];
  await import(readmePath);
  progress.stepDone();

  // 6. agents
  progress.start("agents");
  const agentsPath = path.join(PKG_DIR, "docs/commands/agents.js");
  process.argv = [process.argv[0], agentsPath, ...dryRunArg];
  await import(agentsPath);
  progress.stepDone();

  progress.done();
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

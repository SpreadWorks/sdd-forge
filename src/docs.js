#!/usr/bin/env node
/**
 * src/docs.js
 *
 * Docs dispatcher. Routes docs-related subcommands to scripts under docs/commands/.
 */

import fs from "fs";
import path from "path";
import { PKG_DIR } from "./lib/cli.js";
import { sddConfigPath } from "./lib/config.js";

/** Subcommand → script mapping */
const SCRIPTS = {
  default:    "docs/commands/default-project.js",
  scan:       "docs/commands/scan.js",
  init:       "docs/commands/init.js",
  data:       "docs/commands/data.js",
  text:       "docs/commands/text.js",
  readme:     "docs/commands/readme.js",
  forge:      "docs/commands/forge.js",
  setup:      "docs/commands/setup.js",
  review:     "docs/commands/review.js",
  changelog:  "docs/commands/changelog.js",
  agents:     "docs/commands/agents.js",
  upgrade:    "docs/commands/upgrade.js",
  translate:  "docs/commands/translate.js",
};

// Extract subcommand from argv (set by sdd-forge.js)
const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

async function runCommandMain(mainFn, scriptPath, argv) {
  const prevArgv = process.argv;
  process.argv = [prevArgv[0], scriptPath, ...argv];
  try {
    await mainFn();
  } finally {
    process.argv = prevArgv;
  }
}

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

  // Import all pipeline modules (main() is exported, not auto-executed)
  const { main: scanMain } = await import(scanPath);
  const { main: initMain } = await import(initPath);
  const { main: dataMain } = await import(dataPath);
  const { main: textMain } = await import(textPath);
  const { main: readmeMain } = await import(readmePath);
  const agentsPath = path.join(PKG_DIR, "docs/commands/agents.js");
  const { main: agentsMain } = await import(agentsPath);

  // 1. scan (always runs — analysis.json is internal cache, not user-facing)
  progress.start("scan");
  await runCommandMain(scanMain, scanPath, []);
  progress.stepDone();

  // 2. init
  progress.start("init");
  await runCommandMain(initMain, initPath, [...initArgs, ...dryRunArg]);
  progress.stepDone();

  // 3. data
  progress.start("data");
  await runCommandMain(dataMain, dataPath, [...dryRunArg]);
  progress.stepDone();

  // 4. text
  progress.start("text");
  const { loadJsonFile } = await import(path.join(PKG_DIR, "lib/config.js"));
  const workRoot = process.env.SDD_WORK_ROOT || process.cwd();
  let agentArgs = [];
  try {
    const cfg = loadJsonFile(sddConfigPath(workRoot));
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
    await runCommandMain(textMain, textPath, [...agentArgs, ...dryRunArg]);
  } else {
    progress.log("[text] WARN: no defaultAgent configured, skipping text generation.");
    progress.log("[text] Set 'defaultAgent' in config.json or use: sdd-forge text --agent <name>");
  }
  progress.stepDone();

  // 5. readme
  progress.start("readme");
  await runCommandMain(readmeMain, readmePath, [...dryRunArg]);
  progress.stepDone();

  // 6. agents
  progress.start("agents");
  await runCommandMain(agentsMain, agentsPath, [...dryRunArg]);
  progress.stepDone();

  // 7. Multi-language: generate non-default languages
  let cfg;
  try {
    cfg = loadJsonFile(sddConfigPath(workRoot));
  } catch (_) {
    cfg = {};
  }

  const { resolveOutputConfig } = await import(path.join(PKG_DIR, "lib/types.js"));
  const outputCfg = resolveOutputConfig(cfg);

  if (outputCfg.isMultiLang) {
    const nonDefaultLangs = outputCfg.languages.filter((l) => l !== outputCfg.default);
    const docsDir = path.join(workRoot, "docs");

    if (outputCfg.mode === "translate") {
      // Translate mode: translate default docs to non-default languages
      const translatePath = path.join(PKG_DIR, "docs/commands/translate.js");
      const { main: translateMain } = await import(translatePath);
      progress.log(`[build] Translating to: ${nonDefaultLangs.join(", ")}`);
      await runCommandMain(translateMain, translatePath, [...dryRunArg]);
    } else {
      // Generate mode: run init → data → text → readme for each non-default language
      for (const lang of nonDefaultLangs) {
        const langDocsDir = path.join(docsDir, lang);
        progress.log(`[build] Generating ${lang}...`);

        // init for this language
        await runCommandMain(initMain, initPath, ["--lang", lang, "--docs-dir", langDocsDir, ...initArgs, ...dryRunArg]);

        // data for this language
        await runCommandMain(dataMain, dataPath, ["--docs-dir", langDocsDir, ...dryRunArg]);

        // text for this language
        if (agentArgs.length > 0) {
          await runCommandMain(textMain, textPath, ["--lang", lang, "--docs-dir", langDocsDir, ...agentArgs, ...dryRunArg]);
        }

        // readme for this language
        const langReadmePath = path.join(langDocsDir, "README.md");
        await runCommandMain(readmeMain, readmePath, ["--lang", lang, "--output", langReadmePath, ...dryRunArg]);
      }
    }

    // Resolve lang.links across all files (default + non-default)
    progress.log("[build] Resolving lang.links...");
    await runCommandMain(dataMain, dataPath, [...dryRunArg]);
    for (const lang of nonDefaultLangs) {
      const langDocsDir = path.join(docsDir, lang);
      if (fs.existsSync(langDocsDir)) {
        await runCommandMain(dataMain, dataPath, ["--docs-dir", langDocsDir, ...dryRunArg]);
      }
    }
  }

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

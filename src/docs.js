#!/usr/bin/env node
/**
 * src/docs.js
 *
 * Docs dispatcher. Routes docs-related subcommands to scripts under docs/commands/.
 */

import fs from "fs";
import path from "path";
import { PKG_DIR } from "./lib/cli.js";
import { resolveCommandContext } from "./docs/lib/command-context.js";
import { resolveOutputConfig } from "./lib/types.js";

/** Subcommand → script mapping */
const SCRIPTS = {
  scan:       "docs/commands/scan.js",
  enrich:     "docs/commands/enrich.js",
  init:       "docs/commands/init.js",
  data:       "docs/commands/data.js",
  text:       "docs/commands/text.js",
  readme:     "docs/commands/readme.js",
  forge:      "docs/commands/forge.js",
  review:     "docs/commands/review.js",
  changelog:  "docs/commands/changelog.js",
  agents:     "docs/commands/agents.js",
  translate:  "docs/commands/translate.js",
};

// Extract subcommand from argv (set by sdd-forge.js)
const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

// No subcommand → show available subcommands
if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  const cmds = ["build", ...Object.keys(SCRIPTS)];
  console.error("Usage: sdd-forge docs <command>\n");
  console.error("Available commands:");
  for (const c of cmds) console.error(`  ${c}`);
  console.error("\nRun: sdd-forge docs <command> --help");
  process.exit(subCmd ? 0 : 1);
}

// build: scan → init → data → text → readme → agents → translate pipeline
if (subCmd === "build") {
  if (rest.includes("-h") || rest.includes("--help")) {
    const { translate } = await import(path.join(PKG_DIR, "lib/i18n.js"));
    const t = translate();
    const h = t.raw("ui:help.cmdHelp.build");
    const o = h.options;
    console.log([
      h.usage, "", `  ${h.desc}`, `  ${h.descDetail}`, "", "Options:",
      `  ${o.agent}`, `  ${o.force}`, `  ${o.dryRun}`, `  ${o.verbose}`, `  ${o.help}`,
    ].join("\n"));
    process.exit(0);
  }

  const isVerbose = rest.includes("--verbose");
  const isDryRun = rest.includes("--dry-run");
  const hasForce = rest.includes("--force");
  const otherArgs = rest.filter((a) => !["--force", "--verbose", "--dry-run"].includes(a));

  // Build shared context once
  const baseCtx = resolveCommandContext(null);

  const outputCfg = resolveOutputConfig(baseCtx.config);
  const hasTranslateStep = outputCfg.isMultiLang;

  const pipelineSteps = [
    { label: "scan", weight: 1 },
    { label: "enrich", weight: 2 },
    { label: "init", weight: 1 },
    { label: "data", weight: 1 },
    { label: "text", weight: 3 },
    { label: "readme", weight: 1 },
    { label: "agents", weight: 1 },
    ...(hasTranslateStep ? [{ label: "translate", weight: 2 }] : []),
  ];

  // Set up progress bar for the build pipeline
  const { createProgress } = await import(path.join(PKG_DIR, "lib/progress.js"));
  const progress = createProgress(pipelineSteps, {
    verbose: isVerbose,
    title: "Generating docs with SDD Forge...",
  });

  // Import all pipeline modules
  const { main: scanMain } = await import(path.join(PKG_DIR, "docs/commands/scan.js"));
  const { main: enrichMain } = await import(path.join(PKG_DIR, "docs/commands/enrich.js"));
  const { main: initMain } = await import(path.join(PKG_DIR, "docs/commands/init.js"));
  const { main: dataMain } = await import(path.join(PKG_DIR, "docs/commands/data.js"));
  const { main: textMain } = await import(path.join(PKG_DIR, "docs/commands/text.js"));
  const { main: readmeMain } = await import(path.join(PKG_DIR, "docs/commands/readme.js"));
  const { main: agentsMain } = await import(path.join(PKG_DIR, "docs/commands/agents.js"));

  const hasAgent = !!baseCtx.config.agent?.default;

  try {
    // 1. scan
    progress.start("scan");
    await scanMain({ ...baseCtx });
    progress.stepDone();

    // 2. enrich
    progress.start("enrich");
    if (hasAgent) {
      await enrichMain({ ...baseCtx, commandId: "docs.enrich" });
    } else {
      progress.log("[enrich] WARN: no defaultAgent configured, skipping enrich.");
    }
    progress.stepDone();

    // 3. init
    progress.start("init");
    await initMain({ ...baseCtx, force: hasForce, dryRun: isDryRun });
    progress.stepDone();

    // 4. data
    progress.start("data");
    await dataMain({ ...baseCtx, dryRun: isDryRun });
    progress.stepDone();

    // 5. text
    progress.start("text");
    if (hasAgent) {
      const textResult = await textMain({ ...baseCtx, dryRun: isDryRun, commandId: "docs.text" });
      if (textResult?.errors?.length > 0) {
        progress.log(`[text] WARN: ${textResult.errors.length} file(s) had errors. Pipeline continues but docs may be incomplete.`);
      }
    } else {
      progress.log("[text] WARN: no defaultAgent configured, skipping text generation.");
    }
    progress.stepDone();

    // 6. readme
    progress.start("readme");
    await readmeMain({ ...baseCtx, dryRun: isDryRun });
    progress.stepDone();

    // 7. agents
    progress.start("agents");
    await agentsMain({ ...baseCtx, dryRun: isDryRun });
    progress.stepDone();

    // 8. Multi-language: generate non-default languages
    if (outputCfg.isMultiLang) {
      progress.start("translate");
      const nonDefaultLangs = outputCfg.languages.filter((l) => l !== outputCfg.default);
      const docsDir = baseCtx.docsDir;

      if (outputCfg.mode === "translate") {
        const { main: translateMain } = await import(path.join(PKG_DIR, "docs/commands/translate.js"));
        progress.log(`[build] Translating to: ${nonDefaultLangs.join(", ")}`);
        await translateMain({ ...baseCtx, dryRun: isDryRun });
      } else {
        for (const lang of nonDefaultLangs) {
          const langDocsDir = path.join(docsDir, lang);
          const langCtx = { ...baseCtx, outputLang: lang, docsDir: langDocsDir };
          progress.log(`[build] Generating ${lang}...`);

          await initMain({ ...langCtx, force: hasForce, dryRun: isDryRun });
          await dataMain({ ...langCtx, dryRun: isDryRun });
          if (hasAgent) {
            const langTextResult = await textMain({ ...langCtx, dryRun: isDryRun, commandId: "docs.text" });
            if (langTextResult?.errors?.length > 0) {
              progress.log(`[text] WARN: ${lang}: ${langTextResult.errors.length} file(s) had errors.`);
            }
          }
          const langReadmePath = path.join(langDocsDir, "README.md");
          await readmeMain({ ...langCtx, dryRun: isDryRun, output: langReadmePath });
        }
      }

      if (outputCfg.mode === "translate") {
        for (const lang of nonDefaultLangs) {
          const langDocsDir = path.join(docsDir, lang);
          if (fs.existsSync(langDocsDir)) {
            const langReadmePath = path.join(langDocsDir, "README.md");
            progress.log(`[build] Regenerating ${lang}/README.md...`);
            await readmeMain({ ...baseCtx, outputLang: lang, docsDir: langDocsDir, dryRun: isDryRun, output: langReadmePath });
          }
        }
      }

      progress.log("[build] Resolving lang.links...");
      await dataMain({ ...baseCtx, dryRun: isDryRun });
      for (const lang of nonDefaultLangs) {
        const langDocsDir = path.join(docsDir, lang);
        if (fs.existsSync(langDocsDir)) {
          await dataMain({ ...baseCtx, docsDir: langDocsDir, dryRun: isDryRun });
        }
      }
      progress.stepDone();
    }

    progress.done();
  } catch (err) {
    progress.done();
    console.error(`[build] ERROR: ${err.message}`);
    process.exit(1);
  }
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

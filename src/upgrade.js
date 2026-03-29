#!/usr/bin/env node
/**
 * sdd-forge/upgrade.js
 *
 * Upgrade template-derived files (skills, AGENTS.md SDD section) to match
 * the currently installed sdd-forge version.
 *
 * Safe to run repeatedly — only overwrites template-managed content.
 * Does NOT touch config.json or context.json.
 *
 * Usage:
 *   sdd-forge upgrade [--dry-run]
 */

import { runIfDirect } from "./lib/entrypoint.js";
import { repoRoot, parseArgs } from "./lib/cli.js";
import { loadConfig } from "./lib/config.js";
import { translate } from "./lib/i18n.js";
import { deploySkills } from "./lib/skills.js";


// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseUpgradeArgs(argv) {
  return parseArgs(argv, {
    flags: ["--dry-run"],
    options: [],
    defaults: { dryRun: false },
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const cli = parseUpgradeArgs(process.argv.slice(2));

  if (cli.help) {
    const { translate: tr } = await import("./lib/i18n.js");
    const tu = tr();
    const h = tu.raw("ui:help.cmdHelp.upgrade");
    const o = h.options;
    const files = h.updatedFiles || [];
    console.log([
      h.usage, "", `  ${h.desc}`, `  ${h.descDetail}`, "",
      "Updated files:",
      ...files.map((f) => `  ${f}`),
      "", "Options:", `  ${o.dryRun}`, `  ${o.help}`,
    ].join("\n"));
    return;
  }

  const root = repoRoot();
  const config = loadConfig(root);
  const t = translate();
  const dryRun = cli.dryRun;

  if (dryRun) {
    console.log(t("ui:upgrade.dryRunHeader"));
  }

  // 1. Skills upgrade
  let skillResults;
  try {
    skillResults = deploySkills(root, config.lang, { dryRun });
  } catch (e) {
    console.error(`upgrade failed: ${e.message}`);
    process.exit(1);
  }
  for (const { name, status } of skillResults) {
    if (status === "updated") {
      console.log(t("ui:upgrade.skillUpdated", { name }));
    } else {
      console.log(t("ui:upgrade.skillUnchanged", { name }));
    }
  }

  // Summary
  const hasChanges = skillResults.some((r) => r.status === "updated");
  if (!hasChanges) {
    console.log(t("ui:upgrade.noChanges"));
  } else if (dryRun) {
    console.log(t("ui:upgrade.dryRunFooter"));
  } else {
    console.log(t("ui:upgrade.done"));
  }
}

runIfDirect(import.meta.url, main);

export { main };

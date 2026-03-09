#!/usr/bin/env node
/**
 * sdd-forge/docs/commands/upgrade.js
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

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { PKG_DIR, repoRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig } from "../../lib/config.js";
import { createI18n } from "../../lib/i18n.js";


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
// Skills upgrade
// ---------------------------------------------------------------------------

/**
 * Upgrade skill files from templates.
 * Returns an array of { name, status } where status is "updated" | "unchanged".
 */
function upgradeSkills(workRoot, dryRun) {
  const agentsSkillsDir = path.join(workRoot, ".agents", "skills");
  const claudeSkillsDir = path.join(workRoot, ".claude", "skills");
  const templatesDir = path.join(PKG_DIR, "templates", "skills");

  const skillNames = fs.readdirSync(templatesDir).filter(
    (d) => fs.existsSync(path.join(templatesDir, d, "SKILL.md")),
  );
  const results = [];

  for (const name of skillNames) {
    const srcPath = path.join(templatesDir, name, "SKILL.md");
    const destPath = path.join(agentsSkillsDir, name, "SKILL.md");

    const srcContent = fs.readFileSync(srcPath, "utf8");
    let status = "updated";

    // Compare with existing (lstat to detect symlinks without following)
    let isSymlink = false;
    try {
      const stat = fs.lstatSync(destPath);
      isSymlink = stat.isSymbolicLink();
      if (!isSymlink) {
        const existing = fs.readFileSync(destPath, "utf8");
        if (existing === srcContent) {
          status = "unchanged";
          results.push({ name, status });
          continue;
        }
      }
    } catch (_) {
      // file doesn't exist — will be created
    }

    if (!dryRun) {
      // Remove symlink if present so we can write a real file
      if (isSymlink) {
        fs.unlinkSync(destPath);
      }
      // Copy template to .agents/skills/<name>/SKILL.md
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, srcContent, "utf8");

      // Recreate symlink in .claude/skills/<name>/SKILL.md
      const linkDir = path.join(claudeSkillsDir, name);
      fs.mkdirSync(linkDir, { recursive: true });
      const link = path.join(linkDir, "SKILL.md");
      const target = path.join("..", "..", "..", ".agents", "skills", name, "SKILL.md");
      try { fs.unlinkSync(link); } catch (_) {}
      fs.symlinkSync(target, link);
    }

    results.push({ name, status });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Config hints (non-destructive — just prints suggestions)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_FLAGS = {
  claude: "--system-prompt",
  codex: "--system-prompt-file",
};

/**
 * Check config.json for missing new settings and print hints.
 */
function checkConfigHints(config, t) {
  if (!config.providers) return;

  for (const [key, prov] of Object.entries(config.providers)) {
    if (prov.systemPromptFlag) continue;
    const suggested = SYSTEM_PROMPT_FLAGS[key] || SYSTEM_PROMPT_FLAGS[prov.command];
    if (suggested) {
      console.log(t("upgrade.hintSystemPromptFlag", { provider: key, flag: suggested }));
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const cli = parseUpgradeArgs(process.argv.slice(2));

  if (cli.help) {
    const { loadLang } = await import("../../lib/config.js");
    const { createI18n } = await import("../../lib/i18n.js");
    const { repoRoot } = await import("../../lib/cli.js");
    const tu = createI18n(loadLang(repoRoot()));
    const h = tu.raw("help.cmdHelp.upgrade");
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
  const t = createI18n(config.lang);
  const dryRun = cli.dryRun;

  if (dryRun) {
    console.log(t("upgrade.dryRunHeader"));
  }

  // 1. Skills upgrade
  const skillResults = upgradeSkills(root, dryRun);
  for (const { name, status } of skillResults) {
    if (status === "updated") {
      console.log(t("upgrade.skillUpdated", { name }));
    } else {
      console.log(t("upgrade.skillUnchanged", { name }));
    }
  }

  // 2. Config hints — check for missing new settings
  checkConfigHints(config, t);

  // Summary
  const hasChanges = skillResults.some((r) => r.status === "updated");
  if (!hasChanges) {
    console.log(t("upgrade.noChanges"));
  } else if (dryRun) {
    console.log(t("upgrade.dryRunFooter"));
  } else {
    console.log(t("upgrade.done"));
  }
}

runIfDirect(import.meta.url, main);

export { main };

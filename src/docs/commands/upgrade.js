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
import { loadSddTemplate } from "../../lib/agents-md.js";


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
// AGENTS.md SDD section upgrade
// ---------------------------------------------------------------------------

/**
 * Upgrade the SDD section in AGENTS.md.
 * Returns "updated" | "unchanged" | "not_found".
 */
function upgradeAgentsSddSection(workRoot, lang, dryRun) {
  const agentsPath = path.join(workRoot, "AGENTS.md");
  if (!fs.existsSync(agentsPath)) return "not_found";

  const sddContent = loadSddTemplate(lang);
  if (!sddContent) return "unchanged";

  const existing = fs.readFileSync(agentsPath, "utf8");
  const sddPattern = /<!-- SDD:START[^>]*-->[\s\S]*?<!-- SDD:END -->/;

  if (!sddPattern.test(existing)) return "not_found";

  const updated = existing.replace(sddPattern, sddContent.trim());
  if (updated === existing) return "unchanged";

  if (!dryRun) {
    fs.writeFileSync(agentsPath, updated, "utf8");
  }

  return "updated";
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
    console.log([
      "Usage: sdd-forge upgrade [options]",
      "",
      "Upgrade template-derived files to match the installed sdd-forge version.",
      "Does NOT modify config.json or context.json.",
      "",
      "Updated files:",
      "  .agents/skills/*/SKILL.md        Skill templates",
      "  .claude/skills/*/SKILL.md        Symlinks to .agents/skills/",
      "  AGENTS.md (SDD section only)     Legacy <!-- SDD:START/END --> migration",
      "",
      "Options:",
      "  --dry-run    Show what would change without writing files",
      "  -h, --help   Show this help",
    ].join("\n"));
    return;
  }

  const workRoot = repoRoot();
  const config = loadConfig(workRoot);
  const lang = config.lang;
  const t = createI18n(config.lang);
  const dryRun = cli.dryRun;

  if (dryRun) {
    console.log(t("upgrade.dryRunHeader"));
  }

  // 1. Skills upgrade
  const skillResults = upgradeSkills(workRoot, dryRun);
  for (const { name, status } of skillResults) {
    if (status === "updated") {
      console.log(t("upgrade.skillUpdated", { name }));
    } else {
      console.log(t("upgrade.skillUnchanged", { name }));
    }
  }

  // 2. AGENTS.md SDD section upgrade
  const agentsStatus = upgradeAgentsSddSection(workRoot, lang, dryRun);
  if (agentsStatus === "updated") {
    console.log(t("upgrade.agentsUpdated"));
  } else if (agentsStatus === "not_found") {
    console.log(t("upgrade.agentsNotFound"));
  } else {
    console.log(t("upgrade.agentsUnchanged"));
  }

  // 3. Config hints — check for missing new settings
  checkConfigHints(config, t);

  // Summary
  const hasChanges = skillResults.some((r) => r.status === "updated") || agentsStatus === "updated";
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

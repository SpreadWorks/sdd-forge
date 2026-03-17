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

import fs from "fs";
import path from "path";
import { runIfDirect } from "./lib/entrypoint.js";
import { PKG_DIR, repoRoot, parseArgs } from "./lib/cli.js";
import { loadConfig } from "./lib/config.js";
import { translate } from "./lib/i18n.js";


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
 * Resolve the skill template filename for the given language.
 * Falls back to SKILL.en.md if the language-specific file does not exist.
 */
function resolveSkillFile(skillDir, lang) {
  const langFile = path.join(skillDir, `SKILL.${lang}.md`);
  if (fs.existsSync(langFile)) return langFile;
  const enFile = path.join(skillDir, "SKILL.en.md");
  if (fs.existsSync(enFile)) return enFile;
  return null;
}

/**
 * Upgrade skill files from templates.
 * Selects SKILL.{lang}.md based on config lang.
 * Returns an array of { name, status } where status is "updated" | "unchanged".
 */
function upgradeSkills(workRoot, dryRun, lang) {
  const agentsSkillsDir = path.join(workRoot, ".agents", "skills");
  const claudeSkillsDir = path.join(workRoot, ".claude", "skills");
  const templatesDir = path.join(PKG_DIR, "templates", "skills");

  const skillDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const results = [];

  for (const name of skillDirs) {
    const srcPath = resolveSkillFile(path.join(templatesDir, name), lang || "en");
    if (!srcPath) continue;
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
  const providers = config.agent?.providers || config.providers;
  if (!providers) return;

  for (const [key, prov] of Object.entries(providers)) {
    if (prov.systemPromptFlag) continue;
    const suggested = SYSTEM_PROMPT_FLAGS[key] || SYSTEM_PROMPT_FLAGS[prov.command];
    if (suggested) {
      console.log(t("ui:upgrade.hintSystemPromptFlag", { provider: key, flag: suggested }));
    }
  }
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
  const skillResults = upgradeSkills(root, dryRun, config.lang);
  for (const { name, status } of skillResults) {
    if (status === "updated") {
      console.log(t("ui:upgrade.skillUpdated", { name }));
    } else {
      console.log(t("ui:upgrade.skillUnchanged", { name }));
    }
  }

  // 2. Config hints — check for missing new settings
  checkConfigHints(config, t);

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

/**
 * Shared skill deployment logic used by both setup and upgrade.
 */

import fs from "fs";
import path from "path";
import { PKG_DIR } from "./cli.js";
import { resolveIncludes } from "./include.js";

/**
 * Resolve the skill template file in the given directory.
 */
function resolveSkillFile(skillDir) {
  const file = path.join(skillDir, "SKILL.md");
  if (fs.existsSync(file)) return file;
  return null;
}

/**
 * Remove a file if it is a symbolic link (no-op otherwise).
 */
function removeIfSymlink(filePath) {
  try {
    if (fs.lstatSync(filePath).isSymbolicLink()) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) { if (err.code !== "ENOENT") console.error(err); }
  return false;
}

/**
 * Deploy skill files from templates to .agents/skills/ and .claude/skills/.
 *
 * @param {string} workRoot  Project root directory
 * @param {string} lang      Language code for include resolution (e.g. "en", "ja"). Does not affect template file selection (always SKILL.md).
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun=false]  If true, skip writing files
 * @returns {{ name: string, status: "updated" | "unchanged" }[]}
 */
export function deploySkills(workRoot, lang, opts = {}) {
  const { dryRun = false } = opts;
  const agentsSkillsDir = path.join(workRoot, ".agents", "skills");
  const claudeSkillsDir = path.join(workRoot, ".claude", "skills");
  const templatesDir = path.join(PKG_DIR, "templates", "skills");

  const skillDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const results = [];

  for (const name of skillDirs) {
    const srcPath = resolveSkillFile(path.join(templatesDir, name));
    if (!srcPath) continue;

    const agentsDest = path.join(agentsSkillsDir, name, "SKILL.md");
    const claudeDest = path.join(claudeSkillsDir, name, "SKILL.md");
    const rawContent = fs.readFileSync(srcPath, "utf8");
    const srcContent = resolveIncludes(rawContent, {
      baseDir: path.dirname(srcPath),
      pkgDir: PKG_DIR,
      templatesDir: path.join(PKG_DIR, "templates"),
      presetsDir: path.join(PKG_DIR, "presets"),
      lang: lang || "en",
      sourceFile: srcPath,
    });

    // Check if update is needed (compare against .agents/ copy)
    let needsUpdate = true;
    try {
      const stat = fs.lstatSync(agentsDest);
      if (!stat.isSymbolicLink()) {
        const existing = fs.readFileSync(agentsDest, "utf8");
        if (existing === srcContent) needsUpdate = false;
      }
    } catch (err) {
      if (err.code !== "ENOENT") console.error(err);
    }

    if (!needsUpdate) {
      results.push({ name, status: "unchanged" });
      continue;
    }

    if (!dryRun) {
      // .agents/skills/<name>/SKILL.md
      removeIfSymlink(agentsDest);
      fs.mkdirSync(path.dirname(agentsDest), { recursive: true });
      fs.writeFileSync(agentsDest, srcContent, "utf8");

      // .claude/skills/<name>/SKILL.md
      removeIfSymlink(claudeDest);
      fs.mkdirSync(path.dirname(claudeDest), { recursive: true });
      fs.writeFileSync(claudeDest, srcContent, "utf8");
    }

    results.push({ name, status: "updated" });
  }

  return results;
}

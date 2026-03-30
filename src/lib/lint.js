/**
 * src/lib/lint.js
 *
 * Guardrail lint logic: mechanical check of files against lint patterns.
 * Extracted from spec/commands/lint.js for use by flow commands.
 */

import fs from "fs";
import path from "path";
import { runSync } from "./process.js";
import { filterByPhase, matchScope } from "./guardrail.js";

/**
 * Validate lint articles for misconfiguration.
 * Warns when an article has a lint pattern but phase does not include "lint".
 *
 * @param {{ title: string, meta: Object }[]} articles
 * @returns {string[]} Warning messages
 */
export function validateLintArticles(articles) {
  const warnings = [];
  for (const a of articles) {
    if (a.meta?.lint && !a.meta.phase?.includes("lint")) {
      warnings.push(`WARN: "${a.title}" has lint pattern but phase does not include "lint"`);
    }
  }
  return warnings;
}

/**
 * Get changed files between base branch and HEAD.
 *
 * @param {string} root - Repository root
 * @param {string} base - Base branch name
 * @returns {string[]} Relative file paths
 */
export function getChangedFiles(root, base) {
  const res = runSync("git", ["-C", root, "diff", "--name-only", `${base}...HEAD`]);
  if (!res.ok) {
    throw new Error(`git diff failed: ${res.stderr.trim()}`);
  }
  return res.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Run lint patterns against file contents.
 *
 * @param {string} root - Repository root
 * @param {{ title: string, body: string, meta: Object }[]} articles - Lint articles
 * @param {string[]} files - Changed file paths (relative)
 * @returns {{ article: string, file: string, line: number, match: string }[]} Failures
 */
export function runLintChecks(root, articles, files) {
  const failures = [];

  for (const article of articles) {
    const pattern = article.meta.lint;
    if (!pattern) continue;

    const targetFiles = files.filter((f) => matchScope(f, article.meta.scope));

    for (const file of targetFiles) {
      const absPath = path.join(root, file);
      if (!fs.existsSync(absPath)) continue;

      const content = fs.readFileSync(absPath, "utf8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;
        if (pattern.test(lines[i])) {
          failures.push({
            article: article.title,
            file,
            line: i + 1,
            match: lines[i].trim().slice(0, 80),
          });
        }
      }
    }
  }

  return failures;
}

/**
 * Run the full lint pipeline.
 *
 * @param {string} root - Repository root
 * @param {{ title: string, body: string, meta: Object }[]} allArticles - All guardrail articles
 * @param {string} base - Base branch for git diff
 * @returns {{ ok: boolean, warnings: string[], lintArticleCount: number, fileCount: number, failures: Object[] }}
 */
export function runLint(root, allArticles, base) {
  const warnings = validateLintArticles(allArticles);

  // Filter to lint-phase articles with lint patterns
  const lintArticles = filterByPhase(allArticles, "lint").filter((a) => a.meta.lint);

  if (lintArticles.length === 0) {
    return { ok: true, warnings, lintArticleCount: 0, fileCount: 0, failures: [] };
  }

  // Get changed files
  const changedFiles = getChangedFiles(root, base);
  if (changedFiles.length === 0) {
    return { ok: true, warnings, lintArticleCount: lintArticles.length, fileCount: 0, failures: [] };
  }

  // Run checks
  const failures = runLintChecks(root, lintArticles, changedFiles);

  return {
    ok: failures.length === 0,
    warnings,
    lintArticleCount: lintArticles.length,
    fileCount: changedFiles.length,
    failures,
  };
}

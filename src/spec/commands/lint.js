#!/usr/bin/env node
/**
 * src/spec/commands/lint.js
 *
 * Guardrail lint: mechanical check of changed files against lint patterns.
 * Runs RegExp patterns from guardrail articles with phase: [lint].
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { runSync } from "../../lib/process.js";
import { filterByPhase, matchScope, loadMergedArticles } from "./guardrail.js";

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
function getChangedFiles(root, base) {
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
function runLintChecks(root, articles, files) {
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

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    options: ["--base"],
    defaults: { base: "" },
  });

  if (cli.help) {
    console.log([
      "Usage: sdd-forge spec lint --base <branch>",
      "",
      "  Check changed files against guardrail lint patterns.",
      "",
      "Options:",
      "  --base <branch>  Base branch for git diff (required)",
    ].join("\n"));
    return;
  }

  if (!cli.base) {
    throw new Error("--base is required");
  }

  // Load merged guardrail (preset chain + project)
  const allArticles = loadMergedArticles(root);
  if (allArticles.length === 0) {
    console.log("lint: no guardrail articles found, skipping.");
    return;
  }

  // Validate and warn
  const warnings = validateLintArticles(allArticles);
  for (const w of warnings) {
    console.error(w);
  }

  // Filter to lint-phase articles with lint patterns
  const lintArticles = filterByPhase(allArticles, "lint").filter((a) => a.meta.lint);

  if (lintArticles.length === 0) {
    console.log("lint: no lint-phase articles with patterns found. PASS");
    return;
  }

  // Get changed files
  const changedFiles = getChangedFiles(root, cli.base);
  if (changedFiles.length === 0) {
    console.log("lint: no changed files. PASS");
    return;
  }

  console.error(`lint: checking ${lintArticles.length} rule(s) against ${changedFiles.length} file(s)`);

  // Run checks
  const failures = runLintChecks(root, lintArticles, changedFiles);

  if (failures.length === 0) {
    console.log("lint: PASS");
    return;
  }

  // Report failures
  console.error(`lint: ${failures.length} violation(s) found`);
  for (const f of failures) {
    console.error(`  FAIL: [${f.article}] ${f.file}:${f.line} — ${f.match}`);
  }
  process.exitCode = 1;
}

export { main };

runIfDirect(import.meta.url, main);

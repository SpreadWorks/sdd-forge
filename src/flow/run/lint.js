#!/usr/bin/env node
/**
 * src/flow/run/lint.js
 *
 * flow run lint — run guardrail lint patterns against changed files.
 * Returns JSON envelope with lint results.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { loadMergedArticles } from "../../lib/guardrail.js";
import { runLint } from "../../lib/lint.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    options: ["--base"],
    defaults: { base: "" },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run lint [options]",
        "",
        "Check changed files against guardrail lint patterns.",
        "",
        "Options:",
        "  --base <branch>  Base branch for git diff (auto-resolved from flow.json)",
      ].join("\n"),
    );
    return;
  }

  // Resolve base branch from flow state if not provided
  let base = cli.base;
  if (!base) {
    const state = loadFlowState(root);
    if (state?.baseBranch) {
      base = state.baseBranch;
    } else {
      output(fail("run", "lint", "NO_BASE", "no --base provided and no active flow found"));
      return;
    }
  }

  // Load merged guardrail articles
  const allArticles = loadMergedArticles(root);
  if (allArticles.length === 0) {
    output(ok("run", "lint", {
      result: "pass",
      message: "no guardrail articles found",
      warnings: [],
      failures: [],
    }));
    return;
  }

  const result = runLint(root, allArticles, base);

  for (const w of result.warnings) {
    console.error(w);
  }

  if (!result.ok) {
    output(fail("run", "lint", "LINT_FAILED", [
      `${result.failures.length} violation(s) found`,
      ...result.failures.map((f) => `FAIL: [${f.article}] ${f.file}:${f.line} — ${f.match}`),
    ]));
    return;
  }

  output(ok("run", "lint", {
    result: "pass",
    lintArticleCount: result.lintArticleCount,
    fileCount: result.fileCount,
    warnings: result.warnings,
    failures: [],
  }));
}

export { main };
runIfDirect(import.meta.url, main);

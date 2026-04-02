/**
 * src/flow/run/lint.js
 *
 * flow run lint — run guardrail lint patterns against changed files.
 * Returns JSON envelope with lint results.
 */

import { parseArgs } from "../../lib/cli.js";
import { loadMergedGuardrails } from "../../lib/guardrail.js";
import { runLint } from "../../lib/lint.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

export async function execute(ctx) {
  const { root } = ctx;
  const cli = parseArgs(ctx.args, {
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
    const state = ctx.flowState;
    if (state?.baseBranch) {
      base = state.baseBranch;
    } else {
      output(fail("run", "lint", "NO_BASE", "no --base provided and no active flow found"));
      return;
    }
  }

  // Load merged guardrail articles
  const allGuardrails = loadMergedGuardrails(root);
  if (allGuardrails.length === 0) {
    output(ok("run", "lint", {
      result: "pass",
      message: "no guardrails found",
      warnings: [],
      failures: [],
    }));
    return;
  }

  const result = runLint(root, allGuardrails, base);

  for (const w of result.warnings) {
    console.error(w);
  }

  if (!result.ok) {
    output(fail("run", "lint", "LINT_FAILED", [
      `${result.failures.length} violation(s) found`,
      ...result.failures.map((f) => `FAIL: [${f.guardrail}] ${f.file}:${f.line} — ${f.match}`),
    ]));
    return;
  }

  output(ok("run", "lint", {
    result: "pass",
    lintGuardrailCount: result.lintGuardrailCount,
    fileCount: result.fileCount,
    warnings: result.warnings,
    failures: [],
  }));
}

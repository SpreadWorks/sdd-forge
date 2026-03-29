#!/usr/bin/env node
/**
 * src/flow/run/merge.js
 *
 * flow run merge — wraps `flow commands/merge.js` for squash merge or PR creation.
 * Returns JSON envelope with merge strategy and result.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, PKG_DIR } from "../../lib/cli.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import path from "path";

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run", "--pr", "--auto"],
    defaults: { dryRun: false, pr: false, auto: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run merge [options]",
        "",
        "Squash-merge feature branch into base branch, or create a PR.",
        "",
        "Options:",
        "  --dry-run   Show commands without executing",
        "  --pr        Create a pull request instead of squash merge",
        "  --auto      Auto-detect: PR if gh available and enabled, else squash",
      ].join("\n"),
    );
    return;
  }

  const state = loadFlowState(root);

  const scriptPath = path.join(PKG_DIR, "flow", "commands", "merge.js");
  const args = [];
  if (cli.dryRun) args.push("--dry-run");
  if (cli.pr) args.push("--pr");
  if (cli.auto) args.push("--auto");

  const res = runSync("node", [scriptPath, ...args], { cwd: root });

  const stdout = (res.stdout || "").trim();
  const stderr = (res.stderr || "").trim();

  if (!res.ok) {
    output(fail("run", "merge", "MERGE_FAILED", [
      "merge failed",
      ...(stderr ? [stderr] : []),
      ...(stdout ? [stdout] : []),
    ]));
    return;
  }

  // Detect strategy from output
  const isPr = /PR created/i.test(stdout);
  const isSquash = /squash merge/i.test(stdout);
  const isSkipped = /skip:/i.test(stdout);
  const strategy = isPr ? "pr" : isSquash ? "squash" : isSkipped ? "skipped" : "unknown";

  const branch = state?.featureBranch || null;
  const baseBranch = state?.baseBranch || null;

  output(ok("run", "merge", {
    result: cli.dryRun ? "dry-run" : "ok",
    changed: [],
    artifacts: {
      strategy,
      branch,
      baseBranch,
    },
    next: strategy === "skipped" ? null : "cleanup",
    output: stdout,
  }));
}

export { main };
runIfDirect(import.meta.url, main);

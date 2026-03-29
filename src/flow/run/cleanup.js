#!/usr/bin/env node
/**
 * src/flow/run/cleanup.js
 *
 * flow run cleanup — wraps `flow commands/cleanup.js` to delete
 * feature branch/worktree and remove .active-flow entry.
 * Returns JSON envelope.
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
    flags: ["--dry-run"],
    defaults: { dryRun: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run cleanup [options]",
        "",
        "Delete feature branch and/or worktree, remove .active-flow entry.",
        "",
        "Options:",
        "  --dry-run   Show commands without executing",
      ].join("\n"),
    );
    return;
  }

  // Capture state before cleanup removes it
  const state = loadFlowState(root);
  const branch = state?.featureBranch || null;
  const worktree = state?.worktree || false;

  const scriptPath = path.join(PKG_DIR, "flow", "commands", "cleanup.js");
  const args = [];
  if (cli.dryRun) args.push("--dry-run");

  const res = runSync("node", [scriptPath, ...args], { cwd: root });

  const stdout = (res.stdout || "").trim();
  const stderr = (res.stderr || "").trim();

  if (!res.ok) {
    output(fail("run", "cleanup", "CLEANUP_FAILED", [
      "cleanup failed",
      ...(stderr ? [stderr] : []),
      ...(stdout ? [stdout] : []),
    ]));
    return;
  }

  const isSkipped = /skip:/i.test(stdout);

  const deleted = [];
  if (!isSkipped && !cli.dryRun) {
    if (branch) deleted.push(`branch:${branch}`);
    if (worktree) deleted.push("worktree");
    deleted.push(".active-flow entry");
  }

  output(ok("run", "cleanup", {
    result: cli.dryRun ? "dry-run" : isSkipped ? "skipped" : "ok",
    changed: [],
    artifacts: {
      deleted,
    },
    next: null,
    output: stdout,
  }));
}

export { main };
runIfDirect(import.meta.url, main);

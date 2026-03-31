#!/usr/bin/env node
/**
 * src/flow/run/review.js
 *
 * flow run review — wraps `flow commands/review.js` for AI code quality review.
 * Returns JSON envelope with proposal counts and verdicts.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, PKG_DIR, isInsideWorktree, getMainRepoPath } from "../../lib/cli.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import path from "path";

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run", "--skip-confirm"],
    defaults: { dryRun: false, skipConfirm: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run review [options]",
        "",
        "Run AI code quality review on current changes.",
        "",
        "Options:",
        "  --dry-run        Show proposals without applying",
        "  --skip-confirm   Skip initial confirmation prompt",
      ].join("\n"),
    );
    return;
  }

  const scriptPath = path.join(PKG_DIR, "flow", "commands", "review.js");
  const args = [];
  if (cli.dryRun) args.push("--dry-run");
  if (cli.skipConfirm) args.push("--skip-confirm");

  // In worktree mode, review needs to find .active-flow in the main repo
  const env = { ...process.env };
  if (isInsideWorktree(root)) {
    env.SDD_WORK_ROOT = getMainRepoPath(root);
  }

  const res = runSync("node", [scriptPath, ...args], { cwd: root, timeout: 300000, env });

  const stdout = (res.stdout || "").trim();
  const stderr = (res.stderr || "").trim();

  if (!res.ok) {
    output(fail("run", "review", "REVIEW_FAILED", [
      "review command failed",
      ...(stderr ? [stderr] : []),
      ...(stdout ? [stdout] : []),
    ]));
    return;
  }

  // Parse proposal counts from stderr (review writes progress to stderr)
  const proposalMatch = stderr.match(/(\d+) proposal\(s\) generated/);
  const approvedMatch = stderr.match(/(\d+) approved/);
  const rejectedMatch = stderr.match(/(\d+) rejected/);
  const reviewPathMatch = stderr.match(/Results saved to (\S+)/);

  const proposalCount = proposalMatch ? parseInt(proposalMatch[1], 10) : 0;
  const approved = approvedMatch ? parseInt(approvedMatch[1], 10) : 0;
  const rejected = rejectedMatch ? parseInt(rejectedMatch[1], 10) : 0;
  const noChanges = /No changes detected/i.test(stdout);
  const noProposals = /No improvement proposals found/i.test(stdout) || /NO_PROPOSALS/.test(stdout);

  const changed = [];
  if (reviewPathMatch) changed.push(reviewPathMatch[1]);

  const next = noChanges || noProposals || approved === 0 ? "finalize" : "apply";

  output(ok("run", "review", {
    result: noChanges ? "no-changes" : noProposals ? "no-proposals" : "ok",
    changed,
    artifacts: {
      proposalCount,
      approved,
      rejected,
    },
    next,
    output: stdout,
  }));
}

export { main };
runIfDirect(import.meta.url, main);

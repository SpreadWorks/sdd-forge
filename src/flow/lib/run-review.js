/**
 * src/flow/lib/run-review.js
 *
 * FlowCommand: review — wraps `flow commands/review.js` for AI code quality review.
 * Runs review as a subprocess and parses its output.
 */

import { PKG_DIR } from "../../lib/cli.js";
import { runSync } from "../../lib/process.js";
import { FlowCommand } from "./base-command.js";
import path from "path";

/**
 * Parse test review subprocess output into result object.
 */
function parseTestReviewOutput(res, stdout, stderr) {
  const verdictMatch = stderr.match(/verdict=(PASS|FAIL)/);
  const gapCountMatch = stderr.match(/gaps=(\d+)/);
  const reviewPathMatch = stderr.match(/Results saved to (\S+)/);

  const verdict = verdictMatch ? verdictMatch[1] : (res.ok ? "PASS" : "FAIL");
  const gapCount = gapCountMatch ? parseInt(gapCountMatch[1], 10) : 0;

  const changed = [];
  if (reviewPathMatch) changed.push(reviewPathMatch[1]);

  if (!res.ok) {
    throw new Error(
      [`Test review FAIL: ${gapCount} gap(s) remaining`, ...(stdout ? [stdout] : [])].join("\n"),
    );
  }

  return {
    result: "ok",
    changed,
    artifacts: {
      phase: "test",
      verdict,
      gapCount,
    },
    next: "implement",
    output: stdout,
  };
}

export class RunReviewCommand extends FlowCommand {
  async execute(ctx) {
    const { root } = ctx;
    const phase = ctx.phase || null;
    const dryRun = ctx.dryRun || false;
    const skipConfirm = ctx.skipConfirm || false;

    const scriptPath = path.join(PKG_DIR, "flow", "commands", "review.js");
    const args = [];
    if (phase) args.push("--phase", phase);
    if (dryRun) args.push("--dry-run");
    if (skipConfirm) args.push("--skip-confirm");

    const res = runSync("node", [scriptPath, ...args], { cwd: root, timeout: 300000 });

    const stdout = (res.stdout || "").trim();
    const stderr = (res.stderr || "").trim();

    // Route to test review parser
    if (phase === "test") {
      return parseTestReviewOutput(res, stdout, stderr);
    }

    if (!res.ok) {
      throw new Error(
        ["review command failed", ...(stderr ? [stderr] : []), ...(stdout ? [stdout] : [])].join("\n"),
      );
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

    return {
      result: noChanges ? "no-changes" : noProposals ? "no-proposals" : "ok",
      changed,
      artifacts: {
        proposalCount,
        approved,
        rejected,
      },
      next,
      output: stdout,
    };
  }
}

export default RunReviewCommand;

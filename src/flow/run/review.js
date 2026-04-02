/**
 * src/flow/run/review.js
 *
 * flow run review — wraps `flow commands/review.js` for AI code quality review.
 * Returns JSON envelope with proposal counts and verdicts.
 *
 * --phase test: wraps test sufficiency review pipeline.
 *
 * Note: commands/review.js resolves its own context internally (repoRoot, loadFlowState).
 * This wrapper runs it as a subprocess and parses its output into a JSON envelope.
 */

import { parseArgs, PKG_DIR } from "../../lib/cli.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import path from "path";

export async function execute(ctx) {
  const { root } = ctx;
  const cli = parseArgs(ctx.args, {
    flags: ["--dry-run", "--skip-confirm"],
    options: ["--phase"],
    defaults: { dryRun: false, skipConfirm: false, phase: null },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run review [options]",
        "",
        "Run AI code review on current changes.",
        "",
        "Options:",
        "  --phase <type>   Review phase: 'test' for test sufficiency review",
        "  --dry-run        Show proposals without applying",
        "  --skip-confirm   Skip initial confirmation prompt",
      ].join("\n"),
    );
    return;
  }

  const scriptPath = path.join(PKG_DIR, "flow", "commands", "review.js");
  const args = [];
  if (cli.phase) args.push("--phase", cli.phase);
  if (cli.dryRun) args.push("--dry-run");
  if (cli.skipConfirm) args.push("--skip-confirm");

  const res = runSync("node", [scriptPath, ...args], { cwd: root, timeout: 300000 });

  const stdout = (res.stdout || "").trim();
  const stderr = (res.stderr || "").trim();

  // Route to test review parser
  if (cli.phase === "test") {
    return parseTestReviewOutput(res, stdout, stderr);
  }

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

/**
 * Parse test review subprocess output into JSON envelope.
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
    output(fail("run", "review", "TEST_REVIEW_FAIL", [
      `Test review FAIL: ${gapCount} gap(s) remaining`,
      ...(stdout ? [stdout] : []),
    ]));
    return;
  }

  output(ok("run", "review", {
    result: "ok",
    changed,
    artifacts: {
      phase: "test",
      verdict,
      gapCount,
    },
    next: "implement",
    output: stdout,
  }));
}

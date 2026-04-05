/**
 * src/flow/lib/run-review.js
 *
 * FlowCommand: review — wraps `flow commands/review.js` for AI code quality review.
 * Runs review as a subprocess and parses its output.
 */

import { PKG_DIR } from "../../lib/cli.js";
import { runCmd, formatError } from "../../lib/process.js";
import { DEFAULT_AGENT_TIMEOUT_MS } from "../../lib/agent.js";
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
  const gapCount = gapCountMatch ? parseInt(gapCountMatch[1], 10) : null;

  const changed = [];
  if (reviewPathMatch) changed.push(reviewPathMatch[1]);

  if (!res.ok) {
    const detail = gapCount === 0
      ? `Test review subprocess error (0 gaps reported but process exited with error)`
      : gapCount !== null
        ? `Test review FAIL: ${gapCount} gap(s) remaining`
        : `Test review failed (subprocess error)`;
    throw new Error(
      [detail, ...(stderr ? [stderr] : []), ...(stdout ? [stdout] : [])].join("\n"),
    );
  }

  return {
    result: "ok",
    changed,
    artifacts: {
      phase: "test",
      verdict,
      gapCount: gapCount ?? 0,
    },
    next: "implement",
    output: stdout,
  };
}

/**
 * Parse spec review subprocess output into result object.
 */
function parseSpecReviewOutput(res, stdout, stderr) {
  const verdictMatch = stderr.match(/verdict=(PASS|FAIL)/);
  const issueCountMatch = stderr.match(/issues=(\d+)/);
  const reviewPathMatch = stderr.match(/Results saved to (\S+)/);

  const verdict = verdictMatch ? verdictMatch[1] : (res.ok ? "PASS" : "FAIL");
  const issueCount = issueCountMatch ? parseInt(issueCountMatch[1], 10) : null;

  const changed = [];
  if (reviewPathMatch) changed.push(reviewPathMatch[1]);

  if (!res.ok) {
    const detail = issueCount === 0
      ? `Spec review subprocess error (0 issues reported but process exited with error)`
      : issueCount !== null
        ? `Spec review FAIL: ${issueCount} issue(s) remaining`
        : `Spec review failed (subprocess error)`;
    throw new Error(
      [detail, ...(stderr ? [stderr] : []), ...(stdout ? [stdout] : [])].join("\n"),
    );
  }

  return {
    result: "ok",
    changed,
    artifacts: {
      phase: "spec",
      verdict,
      issueCount: issueCount ?? 0,
    },
    next: "approval",
    output: stdout,
  };
}

export { parseTestReviewOutput, parseSpecReviewOutput };

const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY_MS = 3000;

/**
 * Run a command function with retry logic.
 *
 * @param {function} cmdFn - Function that returns { ok, status, stdout, stderr, signal: string|null, killed: boolean }
 * @param {Object} [opts]
 * @param {number} [opts.retryCount=2] - Number of retries (total attempts = retryCount + 1)
 * @param {number} [opts.retryDelayMs=3000] - Delay between retries in milliseconds
 * @returns {Promise<{ ok: boolean, status: number, stdout: string, stderr: string, signal: string|null, killed: boolean }>}
 */
export async function runCmdWithRetry(cmdFn, opts = {}) {
  const retryCount = opts.retryCount ?? DEFAULT_RETRY_COUNT;
  const retryDelayMs = opts.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  let lastRes;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    lastRes = cmdFn();
    if (lastRes.ok) return lastRes;

    // Do not retry on killed/signal (timeout, external termination)
    if (lastRes.signal || lastRes.killed) return lastRes;

    if (attempt < retryCount) {
      const next = attempt + 2;
      const total = retryCount + 1;
      process.stderr.write(`[review] retry ${next}/${total} after ${retryDelayMs}ms...\n`);
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
  return lastRes;
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

    const agentTimeout = ctx.config?.agent?.timeout;
    const timeoutMs = agentTimeout != null ? Number(agentTimeout) * 1000 : DEFAULT_AGENT_TIMEOUT_MS;
    const res = await runCmdWithRetry(
      () => runCmd("node", [scriptPath, ...args], { cwd: root, timeout: timeoutMs }),
    );

    const stdout = (res.stdout || "").trim();
    const stderr = (res.stderr || "").trim();

    // Route to test review parser
    if (phase === "test") {
      return parseTestReviewOutput(res, stdout, stderr);
    }

    // Route to spec review parser
    if (phase === "spec") {
      return parseSpecReviewOutput(res, stdout, stderr);
    }

    if (!res.ok) {
      throw new Error("review command failed: " + formatError(res));
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

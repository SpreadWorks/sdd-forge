/**
 * src/flow/lib/run-finalize.js
 *
 * FlowCommand: finalize pipeline — commit(+retro+report) -> merge -> sync -> cleanup.
 *
 * Sub-step hooks (post, onError) are defined in registry.js.
 * This module uses runSubStep() to apply those hooks around each step.
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { PKG_DIR } from "../../lib/cli.js";
import {
  resolveWorktreePaths, clearFlowState, specIdFromPath,
} from "../../lib/flow-state.js";
import { loadIssueLog, saveIssueLog } from "./set-issue-log.js";
import { isGhAvailable, commentOnIssue } from "../../lib/git-state.js";
import { FlowCommand } from "./base-command.js";
import { FLOW_COMMANDS } from "../registry.js";

/**
 * Create an onError hook for finalize sub-steps that records to issue-log.
 * @param {string} stepName
 * @returns {(ctx: object, err: Error) => void}
 */
export function finalizeOnError(stepName) {
  return (ctx, err) => {
    try {
      const issueLog = loadIssueLog(ctx.root, ctx.flowState.spec);
      issueLog.entries.push({
        step: stepName,
        reason: err.message || String(err),
        timestamp: new Date().toISOString(),
      });
      saveIssueLog(ctx.root, ctx.flowState.spec, issueLog);
    } catch (_) { /* best effort */ }
  };
}

/**
 * Execute cleanup: clear flow state, remove worktree/branch.
 */
function executeCleanupImpl({ root, flowState, worktreePath, mainRepoPath }) {
  const { baseBranch, featureBranch, worktree } = flowState;
  const specId = specIdFromPath(flowState.spec);

  if (featureBranch === baseBranch) {
    clearFlowState(root, specId);
    return { status: "done", message: "spec-only mode" };
  }

  clearFlowState(root, specId);

  if (worktree && mainRepoPath) {
    const wtPath = worktreePath || root;
    if (fs.existsSync(wtPath)) {
      execFileSync("git", ["-C", mainRepoPath, "worktree", "remove", wtPath], { encoding: "utf8" });
    }
    execFileSync("git", ["-C", mainRepoPath, "branch", "-D", featureBranch], { encoding: "utf8" });
    return { status: "done" };
  }

  execFileSync("git", ["branch", "-D", featureBranch], { cwd: root, encoding: "utf8" });
  return { status: "done" };
}

/**
 * Run git commit, returning { status: "skipped" } if there is nothing to commit.
 * Throws on real errors.
 * @param {string[]} args - git commit arguments (e.g. ["-m", "message"])
 * @param {{ cwd: string }} opts - execFileSync options
 * @returns {{ status: string, message?: string }}
 */
function commitOrSkip(args, opts) {
  try {
    execFileSync("git", ["commit", ...args], { ...opts, encoding: "utf8" });
    return { status: "done" };
  } catch (e) {
    if (/nothing to commit/i.test(String(e.stderr || e.message || ""))) {
      return { status: "skipped", message: "nothing to commit" };
    }
    throw e;
  }
}

export const STEP_MAP = {
  1: "commit",
  2: "merge",
  3: "sync",
  4: "cleanup",
};

/**
 * Run a finalize sub-step, applying registry hooks (post, onError).
 * On success: calls post hook if defined, returns result.
 * On error: calls onError hook if defined, returns { status: "failed", message }.
 * @param {string} name - sub-step name (commit, merge, sync, cleanup)
 * @param {Function} fn - step logic returning result
 * @param {Object} ctx - command context
 * @returns {Promise<Object>} step result
 */
async function runSubStep(name, fn, ctx) {
  const stepDef = FLOW_COMMANDS.run.finalize.steps?.[name];
  try {
    const result = await fn();
    if (stepDef?.post) {
      try { await stepDef.post(ctx, result); } catch (_) { /* post hook errors are non-fatal */ }
    }
    return result;
  } catch (err) {
    if (stepDef?.onError) stepDef.onError(ctx, err);
    return { status: "failed", message: String(err.stderr || err.message || err) };
  }
}

/**
 * Post-commit hook implementation: run retro, generate report, commit artifacts.
 * Called by registry's commit.post hook via lazy import.
 * @param {Object} ctx - command context (must have ctx._results)
 */
export async function executeCommitPost(ctx) {
  const { root } = ctx;
  const state = ctx.flowState;
  const results = ctx._results;

  // retro
  try {
    const RetroCommand = (await import("./run-retro.js")).default;
    const retroResult = await new RetroCommand().run({ ...ctx, force: true });
    const summary = retroResult?.artifacts?.summary;
    results.retro = { status: "done", ...(summary ? { summary } : {}) };
  } catch (e) {
    results.retro = { status: "failed", message: String(e.message) };
  }

  // report
  try {
    const { generateReport, saveReport } = await import("../commands/report.js");

    let implDiffStat = "";
    let commitMessages = [];
    try {
      implDiffStat = execFileSync(
        "git", ["diff", "--stat", `${state.baseBranch}...HEAD`],
        { cwd: root, encoding: "utf8" },
      ).trim();
    } catch (_) { /* no diff */ }
    try {
      commitMessages = execFileSync(
        "git", ["log", "--format=%s", `${state.baseBranch}..HEAD`],
        { cwd: root, encoding: "utf8" },
      ).trim().split("\n").filter(Boolean);
    } catch (_) { /* no commits */ }

    let issueLog = { entries: [] };
    try {
      issueLog = loadIssueLog(root, state.spec);
    } catch (_) { /* no issue-log */ }

    const report = generateReport({
      state,
      results,
      redolog: issueLog,
      implDiffStat,
      commitMessages,
    });

    try { saveReport(root, state.spec, report); } catch (e) { report.saveError = e.message; }
    results.report = { status: "done", ...report };
  } catch (e) {
    results.report = { status: "failed", message: String(e.message || e) };
  }

  // post report to issue (if issue-driven flow + gh available)
  if (!state.issue) {
    results.issueComment = { status: "skipped", reason: "no linked issue" };
  } else if (!results.report?.text) {
    results.issueComment = { status: "skipped", reason: "report text missing" };
  } else if (!isGhAvailable()) {
    results.issueComment = { status: "skipped", reason: "gh unavailable" };
  } else {
    const res = commentOnIssue(state.issue, results.report.text, root);
    if (res.ok) {
      results.issueComment = { status: "done", issue: state.issue };
    } else {
      console.error(`Failed to post report to issue #${state.issue}: ${res.error}`);
      results.issueComment = { status: "failed", message: res.error };
    }
  }

  // commit retro + report files
  try {
    execFileSync("git", ["add", "-A"], { cwd: root, encoding: "utf8" });
    execFileSync("git", ["commit", "-m", "chore: add retro and report"], { cwd: root, encoding: "utf8" });
  } catch (e) {
    if (!/nothing to commit/i.test(String(e.stderr || e.message || ""))) {
      if (results.report) {
        results.report.commitNote = "retro/report commit failed: " + String(e.stderr || e.message).slice(0, 200);
      }
    }
  }
}

export class RunFinalizeCommand extends FlowCommand {
  async execute(ctx) {
    const { root } = ctx;
    const mode = ctx.mode;
    const steps = ctx.steps || "";
    const dryRun = ctx.dryRun || false;
    const message = ctx.message || "";

    if (!mode || !["all", "select"].includes(mode)) {
      throw new Error("--mode must be 'all' or 'select'");
    }

    const mergeStrategyInput = ctx.mergeStrategy || "";
    if (mergeStrategyInput && !["squash", "pr"].includes(mergeStrategyInput)) {
      throw new Error("--merge-strategy must be 'squash' or 'pr'");
    }

    // Determine which steps to execute
    let activeSteps;
    if (mode === "all") {
      activeSteps = new Set(Object.keys(STEP_MAP).map(Number));
    } else {
      if (!steps) {
        throw new Error("--steps required when mode is 'select'");
      }
      activeSteps = new Set(steps.split(",").map(Number).filter((n) => STEP_MAP[n]));
      if (activeSteps.size === 0) {
        throw new Error(`no valid steps. valid: ${Object.keys(STEP_MAP).join(",")}`);
      }
    }

    const state = ctx.flowState;

    // Resolve merge strategy: explicit > auto
    const mergeStrategy = mergeStrategyInput || "auto";

    // Resolve paths once
    const { worktreePath, mainRepoPath } = resolveWorktreePaths(root, state);
    const results = {};

    // Share results with post hooks via ctx
    ctx._results = results;

    // -- Step 1: commit (+retro +report as post hook) --
    if (activeSteps.has(1)) {
      if (dryRun) {
        results.commit = { status: "dry-run", message: message || "(auto)" };
      } else {
        results.commit = await runSubStep("commit", () => {
          execFileSync("git", ["add", "-A"], { cwd: root, encoding: "utf8" });
          const msg = message || `feat: ${state.featureBranch || "finalize"}`;
          const res = commitOrSkip(["-m", msg], { cwd: root });
          return { ...res, message: msg };
        }, ctx);
      }
    }

    // -- Step 2: merge --
    if (activeSteps.has(2)) {
      if (dryRun) {
        results.merge = { status: "dry-run", strategy: mergeStrategy };
      } else {
        results.merge = await runSubStep("merge", async () => {
          const { main: mergeMain } = await import("../commands/merge.js");
          const mergeResult = mergeMain({
            root,
            flowState: state,
            worktreePath,
            mainRepoPath,
            mergeStrategy,
          });
          return { status: "done", strategy: mergeResult?.strategy || "squash" };
        }, ctx);
      }
    }

    // -- Merge failure guard: skip subsequent steps --
    if (results.merge?.status === "failed") {
      if (activeSteps.has(3)) results.sync = { status: "skipped", message: "skipped due to merge failure" };
      if (activeSteps.has(4)) results.cleanup = { status: "skipped", message: "skipped due to merge failure" };

      return {
        result: "merge_failed",
        steps: results,
        message: results.merge.message,
        artifacts: { baseBranch: state.baseBranch, featureBranch: state.featureBranch, worktree: !!state.worktree, spec: state.spec },
      };
    }

    // -- Step 3: sync (docs generation -- runs on main repo after merge) --
    if (activeSteps.has(3)) {
      const wasPr = results.merge?.strategy === "pr" || mergeStrategy === "pr";
      if (wasPr) {
        results.sync = { status: "skipped", message: "PR route: run sdd-forge build after PR merge" };
      } else if (dryRun) {
        results.sync = { status: "dry-run" };
      } else {
        results.sync = await runSubStep("sync", async () => {
          const syncCwd = (state.worktree && mainRepoPath) ? mainRepoPath : root;
          const buildScript = path.join(PKG_DIR, "docs.js");
          const { runSync } = await import("../../lib/process.js");
          const buildRes = runSync("node", [buildScript, "build"], { cwd: syncCwd });
          if (!buildRes.ok) {
            throw new Error((buildRes.stderr || buildRes.stdout || "").trim());
          }
          try {
            execFileSync("git", ["add", "docs/", "AGENTS.md", "CLAUDE.md", "README.md"], { cwd: syncCwd, encoding: "utf8" });
          } catch (_) { /* missing files ok */ }
          let diffStat = null;
          let diffSummary = null;
          try {
            diffStat = execFileSync("git", ["diff", "--cached", "--stat"], { cwd: syncCwd, encoding: "utf8" }).trim();
            diffSummary = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: syncCwd, encoding: "utf8" }).trim();
          } catch (_) { /* non-critical */ }
          const commitRes = commitOrSkip(["-m", "docs: sync documentation"], { cwd: syncCwd });
          return { ...commitRes, ...(diffStat && { diffStat }), ...(diffSummary && { diffSummary }) };
        }, ctx);
      }
    }

    // -- Step 4: cleanup --
    if (activeSteps.has(4)) {
      if (dryRun) {
        results.cleanup = { status: "dry-run" };
      } else {
        results.cleanup = await runSubStep("cleanup", () => {
          return executeCleanupImpl({ root, flowState: state, worktreePath, mainRepoPath });
        }, ctx);
      }
    }

    // Mark missing steps as skipped
    for (const name of Object.values(STEP_MAP)) {
      if (!results[name]) results[name] = { status: "skipped" };
    }

    return {
      result: dryRun ? "dry-run" : "ok",
      steps: results,
      artifacts: {
        baseBranch: state.baseBranch || null,
        featureBranch: state.featureBranch || null,
        worktree: state.worktree || false,
        spec: state.spec || null,
      },
    };
  }
}

export default RunFinalizeCommand;

/**
 * src/flow/lib/run-finalize.js
 *
 * FlowCommand: finalize pipeline — commit(+retro+report) -> merge -> sync -> cleanup.
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { PKG_DIR } from "../../lib/cli.js";
import {
  resolveWorktreePaths, clearFlowState, specIdFromPath,
} from "../../lib/flow-state.js";
import { runSync } from "../../lib/process.js";
import { generateReport, saveReport } from "../commands/report.js";
import { loadIssueLog } from "./set-issue-log.js";
import { FlowCommand } from "./base-command.js";
import { RunRetroCommand } from "./run-retro.js";

/**
 * Execute cleanup: clear flow state, remove worktree/branch.
 * @returns {{ status: string, message?: string }}
 */
function executeCleanup({ root, flowState, worktreePath, mainRepoPath }) {
  const { baseBranch, featureBranch, worktree } = flowState;
  const specId = specIdFromPath(flowState.spec);

  if (featureBranch === baseBranch) {
    clearFlowState(root, specId);
    return { status: "done", message: "spec-only mode" };
  }

  clearFlowState(root, specId);

  if (worktree && mainRepoPath) {
    const wtPath = worktreePath || root;
    try {
      if (fs.existsSync(wtPath)) {
        execFileSync("git", ["-C", mainRepoPath, "worktree", "remove", wtPath], { encoding: "utf8" });
      }
      execFileSync("git", ["-C", mainRepoPath, "branch", "-D", featureBranch], { encoding: "utf8" });
      return { status: "done" };
    } catch (e) {
      return { status: "failed", message: String(e.stderr || e.message) };
    }
  }

  try {
    execFileSync("git", ["branch", "-D", featureBranch], { cwd: root, encoding: "utf8" });
    return { status: "done" };
  } catch (e) {
    return { status: "failed", message: String(e.stderr || e.message) };
  }
}

export const STEP_MAP = {
  1: "commit",
  2: "merge",
  3: "sync",
  4: "cleanup",
};

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

    // -- Step 1: commit (+retro +report as post) --
    if (activeSteps.has(1)) {
      if (dryRun) {
        results.commit = { status: "dry-run", message: message || "(auto)" };
      } else {
        // 1a. commit
        try {
          execFileSync("git", ["add", "-A"], { cwd: root, encoding: "utf8" });
          const msg = message || `feat: ${state.featureBranch || "finalize"}`;
          execFileSync("git", ["commit", "-m", msg], { cwd: root, encoding: "utf8" });
          results.commit = { status: "done", message: msg };
        } catch (e) {
          if (/nothing to commit/i.test(e.message || String(e.stderr || ""))) {
            results.commit = { status: "skipped", message: "nothing to commit" };
          } else {
            results.commit = { status: "failed", message: String(e.stderr || e.message) };
          }
        }

        // 1b. retro (post-commit)
        try {
          const retroResult = await new RunRetroCommand().run({ ...ctx, force: true });
          const summary = retroResult?.artifacts?.summary;
          results.retro = { status: "done", ...(summary ? { summary } : {}) };
        } catch (e) {
          results.retro = { status: "failed", message: String(e.message) };
        }

        // 1c. report (post-commit)
        try {
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

          let redolog = { entries: [] };
          try { redolog = loadIssueLog(root, state.spec); } catch (_) { /* no redolog */ }

          const report = generateReport({
            state,
            results,
            redolog,
            implDiffStat,
            commitMessages,
          });

          try { saveReport(root, state.spec, report); } catch (e) { report.saveError = e.message; }
          results.report = { status: "done", ...report };
        } catch (e) {
          results.report = { status: "failed", message: String(e.message || e) };
        }

        // 1d. commit retro + report files
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
    }

    // -- Step 2: merge --
    if (activeSteps.has(2)) {
      if (dryRun) {
        results.merge = { status: "dry-run", strategy: mergeStrategy };
      } else {
        try {
          const { main: mergeMain } = await import("../commands/merge.js");
          const mergeResult = mergeMain({
            root,
            flowState: state,
            worktreePath,
            mainRepoPath,
            mergeStrategy,
          });
          results.merge = { status: "done", strategy: mergeResult?.strategy || "squash" };
        } catch (e) {
          results.merge = { status: "failed", message: String(e.message || e) };
        }
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
        const syncCwd = (state.worktree && mainRepoPath) ? mainRepoPath : root;
        const buildScript = path.join(PKG_DIR, "docs.js");
        const buildRes = runSync("node", [buildScript, "build"], { cwd: syncCwd });
        if (!buildRes.ok) {
          results.sync = { status: "failed", message: (buildRes.stderr || buildRes.stdout || "").trim() };
        } else {
          try {
            execFileSync("git", ["add", "docs/", "AGENTS.md", "CLAUDE.md", "README.md"], { cwd: syncCwd, encoding: "utf8" });
          } catch (_) { /* missing files ok */ }
          let diffStat = null;
          let diffSummary = null;
          try {
            diffStat = execFileSync("git", ["diff", "--cached", "--stat"], { cwd: syncCwd, encoding: "utf8" }).trim();
            diffSummary = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: syncCwd, encoding: "utf8" }).trim();
          } catch (_) { /* non-critical */ }
          try {
            execFileSync("git", ["commit", "-m", "docs: sync documentation"], { cwd: syncCwd, encoding: "utf8" });
            results.sync = { status: "done", ...(diffStat && { diffStat }), ...(diffSummary && { diffSummary }) };
          } catch (e) {
            if (/nothing to commit/i.test(String(e.stderr || e.message || ""))) {
              results.sync = { status: "skipped", message: "nothing to commit" };
            } else {
              results.sync = { status: "failed", message: String(e.stderr || e.message) };
            }
          }
        }
      }
    }

    // -- Step 4: cleanup --
    if (activeSteps.has(4)) {
      if (dryRun) {
        results.cleanup = { status: "dry-run" };
      } else {
        results.cleanup = executeCleanup({ root, flowState: state, worktreePath, mainRepoPath });
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

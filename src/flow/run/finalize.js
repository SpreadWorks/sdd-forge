/**
 * src/flow/run/finalize.js
 *
 * flow run finalize --mode all|select [--steps 1,2,3,4] [--merge-strategy squash|pr] [--dry-run]
 * Execute finalization pipeline: commit(+retro+report) -> merge -> sync -> cleanup.
 */

import fs from "fs";
import { execFileSync } from "child_process";
import { parseArgs, PKG_DIR } from "../../lib/cli.js";
import {
  resolveWorktreePaths, clearFlowState, specIdFromPath,
} from "../../lib/flow-state.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import { generateReport, saveReport } from "../commands/report.js";
import { loadRedoLog } from "../set/redo.js";
import path from "path";

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

export async function execute(ctx) {
  const { root } = ctx;
  const cli = parseArgs(ctx.args, {
    flags: ["--dry-run"],
    options: ["--mode", "--steps", "--merge-strategy", "--message"],
    defaults: { dryRun: false, mode: "", steps: "", mergeStrategy: "", message: "" },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run finalize [options]",
        "",
        "Execute finalization pipeline: commit(+retro+report) -> merge -> sync -> cleanup.",
        "",
        "Options:",
        "  --mode <all|select>           Mode (required)",
        "  --steps <1,2,3,4>            Comma-separated step numbers (select mode: 1=commit 2=merge 3=sync 4=cleanup)",
        "  --merge-strategy <strategy>   squash or pr (default: auto-detect)",
        "  --message <msg>               Custom commit message",
        "  --dry-run                     Preview only",
      ].join("\n"),
    );
    return;
  }

  if (!cli.mode || !["all", "select"].includes(cli.mode)) {
    output(fail("run", "finalize", "INVALID_MODE", "--mode must be 'all' or 'select'"));
    return;
  }

  if (cli.mergeStrategy && !["squash", "pr"].includes(cli.mergeStrategy)) {
    output(fail("run", "finalize", "INVALID_STRATEGY", "--merge-strategy must be 'squash' or 'pr'"));
    return;
  }

  // Determine which steps to execute
  let activeSteps;
  if (cli.mode === "all") {
    activeSteps = new Set(Object.keys(STEP_MAP).map(Number));
  } else {
    if (!cli.steps) {
      output(fail("run", "finalize", "MISSING_STEPS", "--steps required when mode is 'select'"));
      return;
    }
    activeSteps = new Set(cli.steps.split(",").map(Number).filter((n) => STEP_MAP[n]));
    if (activeSteps.size === 0) {
      output(fail("run", "finalize", "INVALID_STEPS", `no valid steps. valid: ${Object.keys(STEP_MAP).join(",")}`));
      return;
    }
  }

  // Load flow state
  const state = ctx.flowState;
  if (!state) {
    output(fail("run", "finalize", "NO_FLOW", "no active flow (flow.json not found)"));
    return;
  }

  // Resolve merge strategy: explicit > auto
  const mergeStrategy = cli.mergeStrategy || "auto";

  // Resolve paths once (R3)
  const { worktreePath, mainRepoPath } = resolveWorktreePaths(root, state);
  const results = {};

  // ── Step 1: commit (+retro +report as post) ──────────────────────
  if (activeSteps.has(1)) {
    if (cli.dryRun) {
      results.commit = { status: "dry-run", message: cli.message || "(auto)" };
    } else {
      // 1a. commit
      try {
        execFileSync("git", ["add", "-A"], { cwd: root, encoding: "utf8" });
        const msg = cli.message || `feat: ${state.featureBranch || "finalize"}`;
        execFileSync("git", ["commit", "-m", msg], { cwd: root, encoding: "utf8" });
        results.commit = { status: "done", message: msg };
      } catch (e) {
        if (/nothing to commit/i.test(e.message || String(e.stderr || ""))) {
          results.commit = { status: "skipped", message: "nothing to commit" };
        } else {
          results.commit = { status: "failed", message: String(e.stderr || e.message) };
        }
      }

      // 1b. retro (post-commit: runs in worktree where diff is available)
      try {
        const { execute: retroExecute } = await import("./retro.js");
        const retroEnvelope = await retroExecute({ ...ctx, args: ["--force"] });
        if (retroEnvelope?.ok) {
          const summary = retroEnvelope.data?.artifacts?.summary;
          results.retro = { status: "done", ...(summary ? { summary } : {}) };
        } else {
          results.retro = { status: "failed", message: retroEnvelope?.errors?.[0]?.messages?.join("; ") || "retro failed" };
        }
      } catch (e) {
        results.retro = { status: "failed", message: String(e.message) };
      }

      // 1c. report (post-commit: generate in worktree before merge)
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
        try { redolog = loadRedoLog(root, state.spec); } catch (_) { /* no redolog */ }

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

  // ── Step 2: merge ─────────────────────────────────────────────────
  if (activeSteps.has(2)) {
    if (cli.dryRun) {
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

  // ── Step 3: sync (docs generation — runs on main repo after merge) ──
  if (activeSteps.has(3)) {
    const wasPr = results.merge?.strategy === "pr" || mergeStrategy === "pr";
    if (wasPr) {
      results.sync = { status: "skipped", message: "PR route: run sdd-forge build after PR merge" };
    } else if (cli.dryRun) {
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

  // ── Step 4: cleanup (R4 — inlined from cleanup.js) ──────────────
  if (activeSteps.has(4)) {
    if (cli.dryRun) {
      results.cleanup = { status: "dry-run" };
    } else {
      results.cleanup = executeCleanup({ root, flowState: state, worktreePath, mainRepoPath });
    }
  }

  // Mark missing steps as skipped
  for (const name of Object.values(STEP_MAP)) {
    if (!results[name]) results[name] = { status: "skipped" };
  }

  output(ok("run", "finalize", {
    result: cli.dryRun ? "dry-run" : "ok",
    steps: results,
    artifacts: {
      baseBranch: state.baseBranch || null,
      featureBranch: state.featureBranch || null,
      worktree: state.worktree || false,
      spec: state.spec || null,
    },
  }));
}

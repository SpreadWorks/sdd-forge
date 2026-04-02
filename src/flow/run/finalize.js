/**
 * src/flow/run/finalize.js
 *
 * flow run finalize --mode all|select [--steps 3,4,5] [--merge-strategy squash|pr] [--dry-run]
 * Execute finalization pipeline: commit -> merge -> retro -> sync -> cleanup -> record.
 */

import { execFileSync } from "child_process";
import { parseArgs, PKG_DIR } from "../../lib/cli.js";
import { resolveWorktreePaths } from "../../lib/flow-state.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import { generateReport, saveReport } from "../commands/report.js";
import { loadRedoLog } from "../set/redo.js";
import path from "path";

const STEP_MAP = {
  1: "commit",
  2: "merge",
  3: "retro",
  4: "sync",
  5: "cleanup",
  6: "report",
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
        "Execute finalization pipeline: commit -> merge -> retro -> sync -> cleanup -> record.",
        "",
        "Options:",
        "  --mode <all|select>           Mode (required)",
        "  --steps <1,2,3,...>           Comma-separated step numbers (select mode: 1=commit 2=merge 3=retro 4=sync 5=cleanup 6=record)",
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
  let mergeStrategy = cli.mergeStrategy;
  if (!mergeStrategy) {
    // Auto-detect: delegate to merge.js --auto
    mergeStrategy = "auto";
  }

  const { mainRepoPath } = resolveWorktreePaths(root, state);
  const results = {};

  // Step 1: commit
  if (activeSteps.has(1)) {
    if (cli.dryRun) {
      results.commit = { status: "dry-run", message: cli.message || "(auto)" };
    } else {
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
    }
  }

  // Step 2: merge
  if (activeSteps.has(2)) {
    if (cli.dryRun) {
      results.merge = { status: "dry-run", strategy: mergeStrategy };
    } else {
      const scriptPath = path.join(PKG_DIR, "flow", "commands", "merge.js");
      const args = [];
      if (mergeStrategy === "pr") {
        args.push("--pr");
      } else if (mergeStrategy === "auto") {
        args.push("--auto");
      }
      // "squash" needs no extra args (merge.js defaults to squash)
      const res = runSync("node", [scriptPath, ...args], { cwd: root });
      if (res.ok) {
        // Detect if auto resolved to PR by checking output
        const isPr = mergeStrategy === "pr" || (mergeStrategy === "auto" && /PR created/i.test(res.stdout || ""));
        results.merge = { status: "done", strategy: isPr ? "pr" : "squash" };
      } else {
        results.merge = { status: "failed", message: (res.stderr || res.stdout || "").trim() };
      }
    }
  }

  // Step 3: retro (spec retrospective — runs in worktree where feature branch diff is available)
  if (activeSteps.has(3)) {
    if (cli.dryRun) {
      results.retro = { status: "dry-run" };
    } else {
      const retroRes = runSync("node", [
        path.join(PKG_DIR, "flow.js"), "run", "retro", "--force",
      ], { cwd: root });
      if (retroRes.ok) {
        let retroData;
        try { retroData = JSON.parse(retroRes.stdout); } catch (_) { retroData = null; }
        // Second commit + merge: bring retro.json into main repo
        if (state.worktree && mainRepoPath) {
          try {
            execFileSync("git", ["add", "-A"], { cwd: root, encoding: "utf8" });
            execFileSync("git", ["commit", "-m", "chore: add retro results"], { cwd: root, encoding: "utf8" });
            execFileSync("git", ["-C", mainRepoPath, "merge", "--squash", state.featureBranch], { encoding: "utf8" });
            execFileSync("git", ["-C", mainRepoPath, "commit", "-m", "chore: add retro results"], { encoding: "utf8" });
          } catch (e) {
            if (!/nothing to commit/i.test(String(e.stderr || e.message || ""))) {
              results.retro = { status: "done", mergeNote: "retro second merge failed: " + String(e.stderr || e.message).slice(0, 200) };
            }
          }
        }
        if (!results.retro) {
          results.retro = { status: "done", ...(retroData?.data?.summary ? { summary: retroData.data.summary } : {}) };
        }
      } else {
        // retro failure does not block the pipeline
        results.retro = { status: "failed", message: (retroRes.stderr || retroRes.stdout || "").trim() };
      }
    }
  }

  // Step 4: sync (docs generation on main branch)
  if (activeSteps.has(4)) {
    // Skip sync if merge was PR route (not yet merged)
    const wasPr = results.merge?.strategy === "pr" || mergeStrategy === "pr";
    if (wasPr) {
      results.sync = { status: "skipped", message: "PR route: run sdd-forge build after PR merge" };
    } else if (cli.dryRun) {
      results.sync = { status: "dry-run" };
    } else {
      // Use mainRepoPath for worktree mode, root for branch mode
      const syncCwd = (state.worktree && mainRepoPath) ? mainRepoPath : root;
      const buildScript = path.join(PKG_DIR, "docs.js");
      const buildRes = runSync("node", [buildScript, "build"], { cwd: syncCwd });
      if (!buildRes.ok) {
        results.sync = { status: "failed", message: (buildRes.stderr || buildRes.stdout || "").trim() };
      } else {
        try {
          execFileSync("git", ["add", "docs/", "AGENTS.md", "CLAUDE.md", "README.md"], { cwd: syncCwd, encoding: "utf8" });
        } catch (_) {
          // ignore errors for missing files
        }
        // Capture diff before commit for report (R3)
        let diffStat = null;
        let diffSummary = null;
        try {
          diffStat = execFileSync("git", ["diff", "--cached", "--stat"], { cwd: syncCwd, encoding: "utf8" }).trim();
          diffSummary = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: syncCwd, encoding: "utf8" }).trim();
        } catch (_) {
          // non-critical: diff info is optional for report
        }
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

  // Step 5: cleanup
  if (activeSteps.has(5)) {
    if (cli.dryRun) {
      results.cleanup = { status: "dry-run" };
    } else {
      const scriptPath = path.join(PKG_DIR, "flow", "commands", "cleanup.js");
      const res = runSync("node", [scriptPath], { cwd: root });
      if (res.ok) {
        results.cleanup = { status: "done" };
      } else {
        results.cleanup = { status: "failed", message: (res.stderr || res.stdout || "").trim() };
      }
    }
  }

  // Step 6: report — runs on main repo (after cleanup, worktree may be gone)
  if (activeSteps.has(6)) {
    if (cli.dryRun) {
      results.report = { status: "dry-run" };
    } else {
      const reportRoot = (state.worktree && mainRepoPath) ? mainRepoPath : root;
      try {
        // Collect implementation diff stat and commit messages from main repo
        let implDiffStat = "";
        let commitMessages = [];
        try {
          implDiffStat = execFileSync(
            "git", ["diff", "--stat", `${state.baseBranch}...HEAD`],
            { cwd: reportRoot, encoding: "utf8" },
          ).trim();
        } catch (_) {
          // no diff available after squash merge
        }
        try {
          commitMessages = execFileSync(
            "git", ["log", "--format=%s", `${state.baseBranch}..HEAD`],
            { cwd: reportRoot, encoding: "utf8" },
          ).trim().split("\n").filter(Boolean);
        } catch (_) {
          // no commits
        }

        // Load redolog from main repo (retro second merge brought it here)
        let redolog = { entries: [] };
        try {
          redolog = loadRedoLog(reportRoot, state.spec);
        } catch (_) {
          // no redolog file
        }

        const report = generateReport({
          state,
          results,
          redolog,
          implDiffStat,
          commitMessages,
        });

        // Save report.json to main repo
        try {
          saveReport(reportRoot, state.spec, report);
        } catch (e) {
          report.saveError = e.message;
        }

        // Commit report.json on main repo
        try {
          const specDir = path.dirname(state.spec);
          execFileSync("git", ["add", path.join(specDir, "report.json")], { cwd: reportRoot, encoding: "utf8" });
          const specTitle = path.basename(path.dirname(state.spec));
          execFileSync("git", ["commit", "-m", `chore: add report for ${specTitle}`], { cwd: reportRoot, encoding: "utf8" });
        } catch (e) {
          if (!/nothing to commit/i.test(String(e.stderr || e.message || ""))) {
            report.commitError = String(e.stderr || e.message);
          }
        }

        results.report = { status: "done", ...report };
      } catch (e) {
        // report errors do not block pipeline
        results.report = { status: "failed", message: String(e.message || e) };
      }
    }
  }

  // Mark missing steps as skipped
  for (const [num, name] of Object.entries(STEP_MAP)) {
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

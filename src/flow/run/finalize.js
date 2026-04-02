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
import path from "path";

const STEP_MAP = {
  1: "commit",
  2: "merge",
  3: "retro",
  4: "sync",
  5: "cleanup",
  6: "record",
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

  // Step 3: retro (spec retrospective — runs before cleanup so .active-flow and branch exist)
  if (activeSteps.has(3)) {
    if (cli.dryRun) {
      results.retro = { status: "dry-run" };
    } else {
      const retroRes = runSync("node", [
        path.join(PKG_DIR, "..", "flow.js"), "run", "retro", "--force",
      ], { cwd: root });
      if (retroRes.ok) {
        let retroData;
        try { retroData = JSON.parse(retroRes.stdout); } catch (_) { retroData = null; }
        results.retro = { status: "done", ...(retroData?.data?.summary ? { summary: retroData.data.summary } : {}) };
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
        try {
          execFileSync("git", ["commit", "-m", "docs: sync documentation"], { cwd: syncCwd, encoding: "utf8" });
          results.sync = { status: "done" };
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

  // Step 6: record (placeholder)
  if (activeSteps.has(6)) {
    results.record = { status: cli.dryRun ? "dry-run" : "done" };
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

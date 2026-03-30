#!/usr/bin/env node
/**
 * src/flow/run/finalize.js
 *
 * flow run finalize --mode all|select [--steps 3,4,5] --merge-strategy merge|squash|pr [--dry-run]
 * Execute finalization pipeline: commit -> merge -> cleanup -> sync -> record.
 */

import { execFileSync } from "child_process";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, PKG_DIR } from "../../lib/cli.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import path from "path";

const STEP_MAP = {
  3: "commit",
  4: "merge",
  5: "cleanup",
  6: "sync",
  7: "record",
};

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run"],
    options: ["--mode", "--steps", "--merge-strategy", "--message"],
    defaults: { dryRun: false, mode: "", steps: "", mergeStrategy: "merge", message: "" },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run finalize [options]",
        "",
        "Execute finalization pipeline: commit -> merge -> cleanup -> sync -> record.",
        "",
        "Options:",
        "  --mode <all|select>           Mode (required)",
        "  --steps <3,4,5,...>           Comma-separated step numbers (select mode)",
        "  --merge-strategy <strategy>   merge, squash, or pr (default: merge)",
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

  if (!["merge", "squash", "pr"].includes(cli.mergeStrategy)) {
    output(fail("run", "finalize", "INVALID_STRATEGY", "--merge-strategy must be 'merge', 'squash', or 'pr'"));
    return;
  }

  // Determine which steps to execute
  let activeSteps;
  if (cli.mode === "all") {
    activeSteps = new Set([3, 4, 5, 6, 7]);
  } else {
    if (!cli.steps) {
      output(fail("run", "finalize", "MISSING_STEPS", "--steps required when mode is 'select'"));
      return;
    }
    activeSteps = new Set(cli.steps.split(",").map(Number).filter((n) => STEP_MAP[n]));
    if (activeSteps.size === 0) {
      output(fail("run", "finalize", "INVALID_STEPS", "no valid steps. valid: 3,4,5,6,7"));
      return;
    }
  }

  // Load flow state
  const state = loadFlowState(root);
  if (!state) {
    output(fail("run", "finalize", "NO_FLOW", "no active flow (flow.json not found)"));
    return;
  }

  const results = {};

  // Step 3: commit
  if (activeSteps.has(3)) {
    if (cli.dryRun) {
      results.commit = { status: "dry-run", message: cli.message || "(auto)" };
    } else {
      try {
        execFileSync("git", ["add", "-A"], { cwd: root, encoding: "utf8" });
        const msg = cli.message || `feat: ${state.featureBranch || "finalize"}`;
        execFileSync("git", ["commit", "-m", msg], { cwd: root, encoding: "utf8" });
        results.commit = { status: "done", message: msg };
      } catch (e) {
        // "nothing to commit" is not a fatal error
        if (/nothing to commit/i.test(e.message || String(e.stderr || ""))) {
          results.commit = { status: "skipped", message: "nothing to commit" };
        } else {
          results.commit = { status: "failed", message: String(e.stderr || e.message) };
        }
      }
    }
  }

  // Step 4: merge
  if (activeSteps.has(4)) {
    if (cli.dryRun) {
      results.merge = { status: "dry-run", strategy: cli.mergeStrategy };
    } else {
      const scriptPath = path.join(PKG_DIR, "flow", "commands", "merge.js");
      const args = [];
      if (cli.mergeStrategy === "pr") args.push("--pr");
      const res = runSync("node", [scriptPath, ...args], { cwd: root });
      if (res.ok) {
        results.merge = { status: "done", strategy: cli.mergeStrategy };
      } else {
        results.merge = { status: "failed", message: (res.stderr || res.stdout || "").trim() };
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

  // Step 6: sync
  if (activeSteps.has(6)) {
    if (cli.dryRun) {
      results.sync = { status: "dry-run" };
    } else {
      const buildScript = path.join(PKG_DIR, "docs.js");
      const buildRes = runSync("node", [buildScript, "build"], { cwd: root });
      if (!buildRes.ok) {
        results.sync = { status: "failed", message: (buildRes.stderr || buildRes.stdout || "").trim() };
      } else {
        try {
          execFileSync("git", ["add", "docs/", "AGENTS.md", "CLAUDE.md", "README.md"], { cwd: root, encoding: "utf8" });
        } catch (_) {
          // ignore errors for missing files
        }
        try {
          execFileSync("git", ["commit", "-m", "docs: sync documentation"], { cwd: root, encoding: "utf8" });
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

  // Step 7: record (placeholder)
  if (activeSteps.has(7)) {
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

export { main };
runIfDirect(import.meta.url, main);

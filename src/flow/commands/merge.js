#!/usr/bin/env node
/**
 * src/flow/commands/merge.js
 *
 * sdd-forge flow merge — flow.json に基づく squash merge。
 * worktree / branch / spec-only を自動判定。
 */

import { execFileSync } from "child_process";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadFlowState, updateStepStatus, resolveWorktreePaths } from "../../lib/flow-state.js";

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run"],
    defaults: { dryRun: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow merge [options]",
        "",
        "Squash-merge feature branch into base branch.",
        "Strategy is auto-detected from flow.json.",
        "",
        "Options:",
        "  --dry-run   Show commands without executing",
      ].join("\n"),
    );
    return;
  }

  const state = loadFlowState(root);
  if (!state) {
    console.error("no active flow (flow.json not found)");
    process.exit(1);
  }

  const { baseBranch, featureBranch, worktree } = state;
  const { worktreePath, mainRepoPath } = resolveWorktreePaths(root, state);

  // Spec-only: featureBranch == baseBranch
  if (featureBranch === baseBranch) {
    console.log("skip: spec-only mode (no merge needed)");
    updateStepStatus(root, "merge", "skipped");
    return;
  }

  // Worktree mode
  if (worktree && mainRepoPath) {
    const cmds = [
      ["git", "-C", mainRepoPath, "merge", "--squash", featureBranch],
      ["git", "-C", mainRepoPath, "commit", "--no-edit"],
    ];
    if (cli.dryRun) {
      for (const cmd of cmds) console.log(cmd.join(" "));
      return;
    }
    for (const cmd of cmds) {
      execFileSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
    }
    updateStepStatus(root, "merge", "done");
    console.log("merge: done (worktree → squash merge)");
    return;
  }

  // Branch mode
  const cmds = [
    ["git", "checkout", baseBranch],
    ["git", "merge", "--squash", featureBranch],
    ["git", "commit", "--no-edit"],
  ];
  if (cli.dryRun) {
    for (const cmd of cmds) console.log(cmd.join(" "));
    return;
  }
  for (const cmd of cmds) {
    execFileSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
  }
  updateStepStatus(root, "merge", "done");
  console.log("merge: done (branch → squash merge)");
}

export { main };

runIfDirect(import.meta.url, main);

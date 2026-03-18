#!/usr/bin/env node
/**
 * src/flow/commands/cleanup.js
 *
 * sdd-forge flow cleanup — flow.json に基づくブランチ・worktree 削除。
 * worktree / branch / spec-only を自動判定。
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, isInsideWorktree } from "../../lib/cli.js";
import { loadFlowState, flowStatePath, updateStepStatus, resolveWorktreePaths } from "../../lib/flow-state.js";

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run"],
    defaults: { dryRun: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow cleanup [options]",
        "",
        "Delete feature branch and/or worktree.",
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
    console.log("skip: spec-only mode (no cleanup needed)");
    updateStepStatus(root, "branch-cleanup", "skipped");
    return;
  }

  // Worktree mode
  if (worktree && mainRepoPath) {
    // If running from inside the worktree, warn that cwd will become invalid
    if (isInsideWorktree(root)) {
      console.log(`cleanup: run from main repo to avoid cwd invalidation: cd ${mainRepoPath}`);
    }

    // Archive flow.json before worktree deletion to prevent loss
    const archiveStep = state.steps?.find((s) => s.id === "archive");
    if (!archiveStep || archiveStep.status !== "done") {
      const flowSrc = flowStatePath(root);
      const specDir = path.join(root, path.dirname(state.spec));
      if (fs.existsSync(flowSrc) && fs.existsSync(specDir)) {
        const dest = path.join(specDir, "flow.json");
        fs.copyFileSync(flowSrc, dest);
        console.log(`cleanup: auto-archived flow.json to ${path.relative(root, dest)}`);
      }
    }

    const worktreeExists = fs.existsSync(worktreePath);

    if (cli.dryRun) {
      if (worktreeExists) {
        console.log(["git", "-C", mainRepoPath, "worktree", "remove", worktreePath].join(" "));
      } else {
        console.log(`skip: worktree already removed (${worktreePath})`);
      }
      console.log(["git", "-C", mainRepoPath, "branch", "-D", featureBranch].join(" "));
      return;
    }

    if (worktreeExists) {
      execFileSync("git", ["-C", mainRepoPath, "worktree", "remove", worktreePath], { stdio: "inherit" });
    } else {
      console.log(`skip: worktree already removed (${worktreePath})`);
    }

    execFileSync("git", ["-C", mainRepoPath, "branch", "-D", featureBranch], { stdio: "inherit" });
    updateStepStatus(root, "branch-cleanup", "done");
    console.log("cleanup: done (worktree removed, branch deleted)");
    return;
  }

  // Branch mode
  const cmds = [
    ["git", "branch", "-D", featureBranch],
  ];
  if (cli.dryRun) {
    for (const cmd of cmds) console.log(cmd.join(" "));
    return;
  }
  for (const cmd of cmds) {
    execFileSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
  }
  updateStepStatus(root, "branch-cleanup", "done");
  console.log("cleanup: done (branch deleted)");
}

export { main };

runIfDirect(import.meta.url, main);

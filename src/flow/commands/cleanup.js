#!/usr/bin/env node
/**
 * src/flow/commands/cleanup.js
 *
 * sdd-forge flow cleanup — .active-flow エントリ削除 + ブランチ・worktree 削除。
 * worktree / branch / spec-only を自動判定。
 */

import fs from "fs";
import { execFileSync } from "child_process";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, isInsideWorktree } from "../../lib/cli.js";
import {
  loadFlowState, resolveWorktreePaths,
  clearFlowState, specIdFromPath,
} from "../../lib/flow-state.js";

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
        "Removes the .active-flow entry. flow.json in specs/ is preserved.",
        "",
        "Options:",
        "  --dry-run   Show commands without executing",
      ].join("\n"),
    );
    return;
  }

  const state = loadFlowState(root);
  if (!state) {
    console.error("no active flow");
    process.exit(1);
  }

  const { baseBranch, featureBranch, worktree } = state;
  const { worktreePath, mainRepoPath } = resolveWorktreePaths(root, state);
  const specId = specIdFromPath(state.spec);

  // Spec-only: featureBranch == baseBranch
  if (featureBranch === baseBranch) {
    console.log("skip: spec-only mode (no cleanup needed)");
    clearFlowState(root, specId);
    return;
  }

  // Worktree mode
  if (worktree && mainRepoPath) {
    if (isInsideWorktree(root)) {
      console.log(`cleanup: run from main repo to avoid cwd invalidation: cd ${mainRepoPath}`);
    }

    const worktreeExists = fs.existsSync(worktreePath);

    if (cli.dryRun) {
      if (worktreeExists) {
        console.log(["git", "-C", mainRepoPath, "worktree", "remove", worktreePath].join(" "));
      } else {
        console.log(`skip: worktree already removed (${worktreePath})`);
      }
      console.log(["git", "-C", mainRepoPath, "branch", "-D", featureBranch].join(" "));
      console.log(`remove .active-flow entry: ${specId}`);
      return;
    }

    // Remove .active-flow entry before worktree deletion (flow.json is preserved in specs/)
    clearFlowState(root, specId);

    if (worktreeExists) {
      execFileSync("git", ["-C", mainRepoPath, "worktree", "remove", worktreePath], { stdio: "inherit" });
    } else {
      console.log(`skip: worktree already removed (${worktreePath})`);
    }

    execFileSync("git", ["-C", mainRepoPath, "branch", "-D", featureBranch], { stdio: "inherit" });
    console.log("cleanup: done (worktree removed, branch deleted)");
    return;
  }

  // Branch mode
  if (cli.dryRun) {
    console.log(["git", "branch", "-D", featureBranch].join(" "));
    console.log(`remove .active-flow entry: ${specId}`);
    return;
  }

  clearFlowState(root, specId);
  execFileSync("git", ["branch", "-D", featureBranch], { stdio: "inherit" });
  console.log("cleanup: done (branch deleted)");
}

export { main };

runIfDirect(import.meta.url, main);

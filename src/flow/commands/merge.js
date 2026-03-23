#!/usr/bin/env node
/**
 * src/flow/commands/merge.js
 *
 * sdd-forge flow merge — flow.json に基づく squash merge または PR 作成。
 * worktree / branch / spec-only を自動判定。
 */

import { execFileSync } from "child_process";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadFlowState, updateStepStatus, resolveWorktreePaths } from "../../lib/flow-state.js";
import { loadConfig } from "../../lib/config.js";

/**
 * Resolve push remote from config.
 * @param {Object} cfg - SDD config
 * @returns {string}
 */
function resolveRemote(cfg) {
  return cfg?.flow?.push?.remote || "origin";
}

/**
 * Check if gh command is available.
 * @returns {boolean}
 */
function isGhAvailable() {
  try {
    execFileSync("gh", ["--version"], { stdio: "ignore" });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Build PR body from flow state.
 * @param {Object} state - flow.json state
 * @returns {string}
 */
function buildPrBody(state) {
  const lines = [];
  if (state.issue) {
    lines.push(`fixes #${state.issue}`);
    lines.push("");
  }
  if (state.request) {
    lines.push(`## Summary`);
    lines.push("");
    lines.push(state.request);
  }
  return lines.join("\n");
}

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run", "--pr", "--auto"],
    defaults: { dryRun: false, pr: false, auto: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow merge [options]",
        "",
        "Squash-merge feature branch into base branch, or create a PR.",
        "Strategy is auto-detected from flow.json.",
        "",
        "Options:",
        "  --dry-run   Show commands without executing",
        "  --pr        Create a pull request instead of squash merge",
        "  --auto      Auto-detect: PR if commands.gh=enable and gh available, else squash",
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

  // Spec-only: featureBranch == baseBranch
  if (featureBranch === baseBranch) {
    console.log("skip: spec-only mode (no merge needed)");
    updateStepStatus(root, "merge", "skipped");
    return;
  }

  // Auto-detect: resolve --auto to --pr or squash based on config
  if (cli.auto) {
    let cfg;
    try { cfg = loadConfig(root); } catch (_) { cfg = {}; }
    const ghEnabled = cfg?.commands?.gh === "enable";
    if (ghEnabled && isGhAvailable()) {
      cli.pr = true;
    }
    // else: fall through to squash merge
  }

  // PR route
  if (cli.pr) {
    if (!isGhAvailable()) {
      console.error("error: gh command is not available. Install GitHub CLI to use --pr.");
      process.exit(1);
    }
    let cfg;
    try {
      cfg = loadConfig(root);
    } catch (_) {
      cfg = {};
    }
    const remote = resolveRemote(cfg);
    const body = buildPrBody(state);
    const specTitle = state.spec?.replace(/^specs\/\d+-/, "").replace(/\/spec\.md$/, "") || featureBranch;

    const pushCmd = ["git", "push", "-u", remote, featureBranch];
    const prCmd = ["gh", "pr", "create",
      "--base", baseBranch,
      "--head", featureBranch,
      "--title", specTitle,
      ...(body ? ["--body", body] : []),
    ];

    if (cli.dryRun) {
      console.log(pushCmd.join(" "));
      console.log(prCmd.join(" "));
      return;
    }

    execFileSync(pushCmd[0], pushCmd.slice(1), { stdio: "inherit" });
    updateStepStatus(root, "push", "done");

    execFileSync(prCmd[0], prCmd.slice(1), { stdio: "inherit" });
    updateStepStatus(root, "pr-create", "done");

    console.log("merge: done (PR created)");
    return;
  }

  // Squash merge route
  const { mainRepoPath } = resolveWorktreePaths(root, state);

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

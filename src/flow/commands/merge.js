#!/usr/bin/env node
/**
 * src/flow/commands/merge.js
 *
 * sdd-forge flow merge — flow.json に基づく squash merge または PR 作成。
 * worktree / branch / spec-only を自動判定。
 */

import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadFlowState, resolveWorktreePaths } from "../../lib/flow-state.js";
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
 * Extract a markdown section body by heading name.
 * Returns trimmed content between the heading and the next same-or-higher level heading, or null if empty.
 * @param {string} content - full markdown text
 * @param {string} heading - heading text to find (e.g. "Goal")
 * @returns {string|null}
 */
function extractSection(content, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$`, "m");
  const match = pattern.exec(content);
  if (!match) return null;
  const start = match.index + match[0].length;
  const rest = content.slice(start);
  const nextHeading = rest.search(/^##\s+/m);
  const body = (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
  return body || null;
}

/**
 * Parse spec.md content and extract Goal, Scope, Requirements sections.
 * @param {string} content - spec.md file content
 * @returns {{goal: string|null, scope: string|null, requirements: string|null}}
 */
function parseSpec(content) {
  if (!content) return { goal: null, scope: null, requirements: null };
  return {
    goal: extractSection(content, "Goal"),
    scope: extractSection(content, "Scope"),
    requirements: extractSection(content, "Requirements"),
  };
}

/**
 * Build PR title from parsed spec.
 * @param {{goal: string|null}|null} spec - parsed spec sections
 * @param {string} fallback - fallback title (e.g. spec directory name)
 * @returns {string}
 */
function buildPrTitle(spec, fallback) {
  if (spec?.goal) {
    const firstLine = spec.goal.split("\n")[0].trim();
    if (firstLine) return firstLine;
  }
  return fallback;
}

/**
 * Build PR body from flow state and parsed spec.
 * @param {Object} state - flow.json state
 * @param {{goal: string|null, scope: string|null, requirements: string|null}|null} spec - parsed spec sections
 * @returns {string}
 */
function buildPrBody(state, spec) {
  const lines = [];
  if (state.issue) {
    lines.push(`fixes #${state.issue}`);
    lines.push("");
  }
  if (spec?.goal) {
    lines.push("## Goal");
    lines.push("");
    lines.push(spec.goal);
    lines.push("");
  }
  if (spec?.requirements) {
    lines.push("## Requirements");
    lines.push("");
    lines.push(spec.requirements);
    lines.push("");
  }
  if (spec?.scope) {
    lines.push("## Scope");
    lines.push("");
    lines.push(spec.scope);
    lines.push("");
  }
  // Fallback: no spec sections available
  if (!spec?.goal && !spec?.requirements && !spec?.scope) {
    if (state.request) {
      lines.push("## Summary");
      lines.push("");
      lines.push(state.request);
    }
  }
  return lines.join("\n").trim();
}

/**
 * Try to read and parse spec.md from flow state.
 * @param {Object} state - flow.json state
 * @param {string} root - project root
 * @returns {{goal: string|null, scope: string|null, requirements: string|null}|null}
 */
function loadSpec(state, root) {
  if (!state.spec) return null;
  try {
    const specPath = resolve(root, state.spec);
    const content = readFileSync(specPath, "utf8");
    return parseSpec(content);
  } catch (_) {
    return null;
  }
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
    const spec = loadSpec(state, root);
    const fallbackTitle = state.spec?.replace(/^specs\/\d+-/, "").replace(/\/spec\.md$/, "") || featureBranch;
    const title = buildPrTitle(spec, fallbackTitle);
    const body = buildPrBody(state, spec);

    const pushCmd = ["git", "push", "-u", remote, featureBranch];
    const prCmd = ["gh", "pr", "create",
      "--base", baseBranch,
      "--head", featureBranch,
      "--title", title,
      ...(body ? ["--body", body] : []),
    ];

    if (cli.dryRun) {
      console.log(pushCmd.join(" "));
      console.log(prCmd.join(" "));
      return;
    }

    execFileSync(pushCmd[0], pushCmd.slice(1), { stdio: "inherit" });
    execFileSync(prCmd[0], prCmd.slice(1), { stdio: "inherit" });
    console.log("merge: done (PR created)");
    return;
  }

  // Squash merge route
  const { mainRepoPath } = resolveWorktreePaths(root, state);
  const specTitle = state.spec?.replace(/^specs\/\d+-/, "").replace(/\/spec\.md$/, "") || featureBranch;
  const commitMsg = state.issue ? `${specTitle}\n\nfixes #${state.issue}` : specTitle;

  // Worktree mode
  if (worktree && mainRepoPath) {
    const cmds = [
      ["git", "-C", mainRepoPath, "merge", "--squash", featureBranch],
      ["git", "-C", mainRepoPath, "commit", "-m", commitMsg],
    ];
    if (cli.dryRun) {
      for (const cmd of cmds) console.log(cmd.join(" "));
      return;
    }
    for (const cmd of cmds) {
      execFileSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
    }
    console.log("merge: done (worktree → squash merge)");
    return;
  }

  // Branch mode
  const cmds = [
    ["git", "checkout", baseBranch],
    ["git", "merge", "--squash", featureBranch],
    ["git", "commit", "-m", commitMsg],
  ];
  if (cli.dryRun) {
    for (const cmd of cmds) console.log(cmd.join(" "));
    return;
  }
  for (const cmd of cmds) {
    execFileSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
  }
  console.log("merge: done (branch → squash merge)");
}

export { main, parseSpec, buildPrTitle, buildPrBody };

runIfDirect(import.meta.url, main);

/**
 * src/lib/git-helpers.js
 *
 * Shared helpers for Git and GitHub CLI operations.
 * Includes both read-only state queries and GitHub actions (e.g. issue comments).
 */

import { runCmd, formatError } from "./process.js";

/** @returns {{ dirty: boolean, dirtyFiles: string[] }} */
export function getWorktreeStatus(cwd) {
  const res = runCmd("git", ["status", "--short"], { cwd });
  if (!res.ok) return { dirty: false, dirtyFiles: [] };
  const files = res.stdout.trim().split("\n").filter(Boolean);
  return { dirty: files.length > 0, dirtyFiles: files };
}

/** @returns {string|null} */
export function getCurrentBranch(cwd) {
  const res = runCmd("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
  return res.ok ? res.stdout.trim() : null;
}

/** @returns {number} */
export function getAheadCount(cwd, baseBranch) {
  const res = runCmd("git", ["rev-list", "--count", `${baseBranch}..HEAD`], { cwd });
  return res.ok ? parseInt(res.stdout.trim(), 10) || 0 : 0;
}

/** @returns {string|null} */
export function getLastCommit(cwd) {
  const res = runCmd("git", ["log", "-1", "--oneline"], { cwd });
  return res.ok ? res.stdout.trim() : null;
}

/** @returns {boolean} */
export function isGhAvailable() {
  return runCmd("gh", ["--version"], { timeout: 5000 }).ok;
}

/**
 * Collect diff stat and commit messages between base and HEAD.
 * @param {string} root - Working directory
 * @param {string} baseBranch - Base branch name
 * @returns {{ diffStat: string, commitMessages: string[] }}
 */
export function collectGitSummary(root, baseBranch) {
  let diffStat = "";
  let commitMessages = [];
  const diffRes = runCmd("git", ["diff", "--stat", `${baseBranch}...HEAD`], { cwd: root });
  if (diffRes.ok) diffStat = diffRes.stdout.trim();
  const logRes = runCmd("git", ["log", "--format=%s", `${baseBranch}..HEAD`], { cwd: root });
  if (logRes.ok) commitMessages = logRes.stdout.trim().split("\n").filter(Boolean);
  return { diffStat, commitMessages };
}

/**
 * Post a comment to a GitHub issue.
 * @param {number|string} issueNumber
 * @param {string} body - Comment body text
 * @param {string} [cwd] - Working directory
 * @returns {{ ok: boolean, error?: string }}
 */
export function commentOnIssue(issueNumber, body, cwd) {
  const res = runCmd("gh", ["issue", "comment", String(issueNumber), "--body", body], {
    cwd,
    timeout: 30000,
  });
  return res.ok ? { ok: true } : { ok: false, error: formatError(res) };
}

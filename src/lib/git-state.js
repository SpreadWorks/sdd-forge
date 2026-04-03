/**
 * src/lib/git-state.js
 *
 * Shared helpers for Git and GitHub CLI operations.
 * Includes both read-only state queries and GitHub actions (e.g. issue comments).
 */

import { execFileSync } from "child_process";

/**
 * Try running a command and return stdout, or null on failure.
 * @param {string} cmd
 * @param {string[]} args
 * @param {Object} [opts]
 * @returns {string|null}
 */
function tryExec(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", ...opts }).trim();
  } catch {
    return null;
  }
}

/** @returns {{ dirty: boolean, dirtyFiles: string[] }} */
export function getWorktreeStatus(cwd) {
  const out = tryExec("git", ["status", "--short"], { cwd });
  if (out === null) return { dirty: false, dirtyFiles: [] };
  const files = out.split("\n").filter(Boolean);
  return { dirty: files.length > 0, dirtyFiles: files };
}

/** @returns {string|null} */
export function getCurrentBranch(cwd) {
  return tryExec("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
}

/** @returns {number} */
export function getAheadCount(cwd, baseBranch) {
  const out = tryExec("git", ["rev-list", "--count", `${baseBranch}..HEAD`], { cwd });
  return out !== null ? parseInt(out, 10) || 0 : 0;
}

/** @returns {string|null} */
export function getLastCommit(cwd) {
  return tryExec("git", ["log", "-1", "--oneline"], { cwd });
}

/** @returns {boolean} */
export function isGhAvailable() {
  return tryExec("gh", ["--version"], { timeout: 5000 }) !== null;
}

/**
 * Post a comment to a GitHub issue.
 * @param {number|string} issueNumber
 * @param {string} body - Comment body text
 * @param {string} [cwd] - Working directory
 * @returns {{ ok: boolean, error?: string }}
 */
export function commentOnIssue(issueNumber, body, cwd) {
  try {
    execFileSync("gh", ["issue", "comment", String(issueNumber), "--body", body], {
      cwd,
      encoding: "utf8",
      timeout: 30000,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

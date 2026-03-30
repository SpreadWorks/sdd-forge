/**
 * src/lib/git-state.js
 *
 * Shared helpers for reading Git and GitHub CLI state.
 * All functions are read-only (no side effects).
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

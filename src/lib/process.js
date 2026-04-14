/**
 * src/lib/process.js
 *
 * Unified command execution helpers.
 * All functions return result objects — they never throw.
 */

import { execFileSync, execFile } from "child_process";

/**
 * Run a command synchronously.
 *
 * Pure command runner: no domain-specific logging is performed here.
 * For git command logging, callers should use `runGit` from `git-helpers.js`.
 *
 * @param {string}   cmd  - Command to execute
 * @param {string[]} args - Argument array
 * @param {Object}   [opts]
 * @param {string}   [opts.cwd]       - Working directory
 * @param {string}   [opts.encoding]  - Encoding (default: "utf8")
 * @param {number}   [opts.timeout]   - Timeout in ms
 * @param {number}   [opts.maxBuffer] - Max stdout/stderr buffer size in bytes
 * @param {Object}   [opts.env]       - Environment variables
 * @returns {{ ok: boolean, status: number, stdout: string, stderr: string, signal: string|null, killed: boolean }}
 */
export function runCmd(cmd, args, opts = {}) {
  try {
    const stdout = execFileSync(cmd, args, {
      cwd: opts.cwd,
      encoding: opts.encoding || "utf8",
      timeout: opts.timeout,
      maxBuffer: opts.maxBuffer,
      stdio: ["pipe", "pipe", "pipe"],
      ...(opts.env && { env: opts.env }),
    });
    return { ok: true, status: 0, stdout: String(stdout || ""), stderr: "", signal: null, killed: false };
  } catch (e) {
    return {
      ok: false,
      status: e.status ?? 1,
      stdout: String(e.stdout || ""),
      stderr: String(e.stderr || ""),
      signal: e.signal ?? null,
      killed: e.killed ?? false,
    };
  }
}

/**
 * Run a command asynchronously.
 *
 * @param {string}   cmd  - Command to execute
 * @param {string[]} args - Argument array
 * @param {Object}   [opts]
 * @param {string}   [opts.cwd]       - Working directory
 * @param {string}   [opts.encoding]  - Encoding (default: "utf8")
 * @param {number}   [opts.timeout]   - Timeout in ms
 * @param {number}   [opts.maxBuffer] - Max stdout/stderr buffer size in bytes
 * @param {Object}   [opts.env]       - Environment variables
 * @returns {Promise<{ ok: boolean, status: number, stdout: string, stderr: string, signal: string|null, killed: boolean }>}
 */
export function runCmdAsync(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(
      cmd,
      args,
      {
        cwd: opts.cwd,
        encoding: opts.encoding || "utf8",
        timeout: opts.timeout,
        maxBuffer: opts.maxBuffer,
        ...(opts.env && { env: opts.env }),
      },
      (err, stdout, stderr) => {
        let result;
        if (err) {
          result = {
            ok: false,
            status: typeof err.code === "number" ? err.code : 1,
            stdout: String(stdout || ""),
            stderr: String(stderr || err.message || ""),
            signal: err.signal ?? null,
            killed: err.killed ?? false,
          };
        } else {
          result = {
            ok: true,
            status: 0,
            stdout: String(stdout || ""),
            stderr: String(stderr || ""),
            signal: null,
            killed: false,
          };
        }
        resolve(result);
      },
    );
  });
}

/**
 * Format a runCmd/runCmdAsync result into a human-readable error string.
 * Context prefix is the caller's responsibility (e.g. `"docs build failed: " + formatError(res)`).
 *
 * @param {{ status: number, stderr: string, signal: string|null, killed: boolean }} res
 * @returns {string} e.g. "signal=SIGKILL (killed) | exit=137 | Killed" or "exit=1"
 */
export function formatError(res) {
  const parts = [];
  if (res.signal) {
    parts.push(`signal=${res.signal}${res.killed ? " (killed)" : ""}`);
  }
  parts.push(`exit=${res.status}`);
  if (res.stderr) {
    parts.push(res.stderr);
  }
  return parts.join(" | ");
}

/**
 * Assert that a runCmd/runCmdAsync result is ok. Throws if not.
 *
 * @param {{ ok: boolean, status: number, stderr: string, signal: string|null, killed: boolean }} res
 * @param {string} context - Description of what failed (e.g. "git push")
 * @throws {Error} if res.ok is false
 */
export function assertOk(res, context) {
  if (!res.ok) throw new Error(context + ": " + formatError(res));
}

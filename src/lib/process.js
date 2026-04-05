/**
 * src/lib/process.js
 *
 * Unified command execution helpers.
 * All functions return result objects — they never throw.
 */

import { execFileSync, execFile } from "child_process";

/**
 * Normalize a failed command's error properties into a consistent result shape.
 * Handles differences between execFileSync (no `killed` property) and execFile callbacks.
 *
 * @param {Object} err - Error or exception object from child_process
 * @param {string} stdout - Captured stdout
 * @param {string} stderr - Captured stderr (falls back to err.message)
 * @returns {{ ok: false, status: number, stdout: string, stderr: string, signal: string|null, killed: boolean }}
 */
function normalizeErrorResult(err, stdout, stderr) {
  const status = typeof err.status === "number" ? err.status
    : typeof err.code === "number" ? err.code
    : 1;
  return {
    ok: false,
    status,
    stdout: String(stdout || ""),
    stderr: String(stderr || err.message || ""),
    signal: err.signal || null,
    killed: err.killed != null ? !!err.killed : !!err.signal,
  };
}

const SUCCESS_BASE = { ok: true, status: 0, signal: null, killed: false };

/**
 * Run a command synchronously.
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
    return { ...SUCCESS_BASE, stdout: String(stdout || ""), stderr: "" };
  } catch (e) {
    return normalizeErrorResult(e, e.stdout, e.stderr);
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
        if (err) {
          resolve(normalizeErrorResult(err, stdout, stderr));
        } else {
          resolve({ ...SUCCESS_BASE, stdout: String(stdout || ""), stderr: String(stderr || "") });
        }
      },
    );
  });
}

/**
 * Format a failed command result into a human-readable error string.
 * Uses pipe-delimited style: "signal=SIGKILL (killed) | exit=137 | stderr content"
 *
 * @param {{ status: number, stderr: string, signal: string|null, killed: boolean }} res
 * @returns {string}
 */
export function formatError(res) {
  const parts = [];
  if (res.signal) {
    parts.push(res.killed ? `signal=${res.signal} (killed)` : `signal=${res.signal}`);
  }
  if (res.status != null) {
    parts.push(`exit=${res.status}`);
  }
  const trimmed = (res.stderr || "").trim();
  if (trimmed) {
    parts.push(trimmed);
  }
  return parts.join(" | ");
}

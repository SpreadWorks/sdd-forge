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
 * @param {string}   cmd  - Command to execute
 * @param {string[]} args - Argument array
 * @param {Object}   [opts]
 * @param {string}   [opts.cwd]       - Working directory
 * @param {string}   [opts.encoding]  - Encoding (default: "utf8")
 * @param {number}   [opts.timeout]   - Timeout in ms
 * @param {number}   [opts.maxBuffer] - Max stdout/stderr buffer size in bytes
 * @param {Object}   [opts.env]       - Environment variables
 * @returns {{ ok: boolean, status: number, stdout: string, stderr: string }}
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
    return { ok: true, status: 0, stdout: String(stdout || ""), stderr: "" };
  } catch (e) {
    return {
      ok: false,
      status: e.status ?? 1,
      stdout: String(e.stdout || ""),
      stderr: String(e.stderr || ""),
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
 * @returns {Promise<{ ok: boolean, status: number, stdout: string, stderr: string }>}
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
          resolve({
            ok: false,
            status: err.code === "ENOENT" ? 1 : (err.code ?? 1),
            stdout: String(stdout || ""),
            stderr: String(stderr || err.message || ""),
          });
        } else {
          resolve({
            ok: true,
            status: 0,
            stdout: String(stdout || ""),
            stderr: String(stderr || ""),
          });
        }
      },
    );
  });
}

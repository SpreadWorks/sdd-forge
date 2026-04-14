/**
 * src/flow/lib/get-test-result.js
 *
 * Return test execution evidence for the current flow.
 * Reads test summary from flow.json and test output log from workDir/logs/test-output.log.
 */

import path from "path";
import fs, { readFileSync } from "fs";
import { FlowCommand } from "./base-command.js";
import { resolveWorkDir } from "../../lib/config.js";

const LOG_RELATIVE = path.join("logs", "test-output.log");
// Cap log read to 512 KB to keep prompts bounded.
const MAX_LOG_BYTES = 512 * 1024;

function readLogFile(workDir) {
  const logPath = path.join(workDir, LOG_RELATIVE);
  try {
    const { size } = fs.statSync(logPath);
    let raw;
    if (size <= MAX_LOG_BYTES) {
      raw = readFileSync(logPath, "utf8");
    } else {
      // Read only the tail portion when the file is large.
      const fd = fs.openSync(logPath, "r");
      try {
        const buf = Buffer.alloc(MAX_LOG_BYTES);
        const offset = size - MAX_LOG_BYTES;
        fs.readSync(fd, buf, 0, MAX_LOG_BYTES, offset);
        raw = `[... truncated, showing last ${MAX_LOG_BYTES} bytes ...]\n` + buf.toString("utf8");
      } finally {
        fs.closeSync(fd);
      }
    }
    // Redact sensitive patterns and write back so the stored file is also clean.
    const redacted = redactLog(raw);
    if (redacted !== raw) {
      fs.writeFileSync(logPath, redacted, "utf8");
    }
    return redacted;
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

/**
 * Redact secrets and common PII patterns from test log output before returning.
 * Covers: credentials (password/token/secret/key), Bearer tokens,
 * email addresses, and credit-card-like digit sequences.
 * @param {string|null} log
 * @returns {string|null}
 */
function redactLog(log) {
  if (!log) return null;
  return log
    // Credential key-value pairs (password=xxx, token: xxx, etc.)
    .replace(/(password|passwd|token|secret|api[_-]?key|auth[_-]?key|private[_-]?key)\s*[=:]\s*\S+/gi, "$1=[REDACTED]")
    // Bearer / Authorization header values
    .replace(/(Bearer|Basic|Digest)\s+[A-Za-z0-9._\-/+=]{8,}/g, "$1 [REDACTED]")
    // Email addresses
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[EMAIL REDACTED]")
    // Credit-card-like sequences (13-19 consecutive digits, possibly spaced)
    .replace(/\b(?:\d[ -]?){13,19}\b/g, "[CARD REDACTED]");
}

/**
 * Load test execution evidence from flow state and log file.
 * @param {string} root - project root
 * @param {Object} config - SddConfig
 * @param {Object} [flowState] - pre-loaded flow state (optional)
 * @returns {{ summary: Object|null, log: string|null }}
 */
export function loadTestEvidence(root, config, flowState) {
  const summary = flowState?.test?.summary ?? null;
  const workDir = resolveWorkDir(root, config);
  const log = readLogFile(workDir);
  return { summary, log };
}

export default class GetTestResultCommand extends FlowCommand {
  execute(ctx) {
    const state = ctx.flowState;
    if (!state) {
      throw new Error("no active flow (flow.json not found)");
    }
    return loadTestEvidence(ctx.root, ctx.config, state);
  }
}

/**
 * sdd-forge/lib/log.js
 *
 * Generic logging foundation. Log is the base class for all log types.
 * logger() is the unified writer that appends JSONL entries.
 */

import fs from "fs";
import path from "path";
import { isInsideWorktree, getMainRepoPath } from "./cli.js";

/**
 * Base class for log entries. Subclasses define:
 *   - static filename  — the JSONL file name
 *   - isEnabled(cfg)   — whether logging is active for this type
 *   - toJSON()         — the data to write
 */
export class Log {
  static filename = undefined;

  isEnabled(_cfg) {
    return true;
  }

  toJSON() {
    return {};
  }
}

/**
 * Resolve log directory from config.
 * Uses logs.dir if set; otherwise falls back to {agent.workDir}/logs relative to cwd.
 *
 * @param {string|null} cwd   - Working directory used for relative path resolution
 * @param {Object} cfg        - SddConfig (or partial)
 * @returns {string}
 */
export function resolveLogDir(cwd, cfg) {
  if (cfg?.logs?.dir) return cfg.logs.dir;
  const workDir = cfg?.agent?.workDir || ".tmp";
  const root = path.resolve(cwd || process.cwd());
  const repoRoot = isInsideWorktree(root) ? getMainRepoPath(root) : root;
  return path.join(repoRoot, workDir, "logs");
}

/**
 * Append a log entry to the appropriate JSONL file.
 * Silently writes errors to stderr — never throws/rejects.
 *
 * @param {Log} log    - Log instance (must extend Log)
 * @param {string|null} cwd
 * @param {Object} cfg
 * @returns {Promise<void>}
 */
export async function logger(log, cwd, cfg) {
  if (!log.isEnabled(cfg)) return;
  const logDir = resolveLogDir(cwd, cfg);
  const filename = log.constructor.filename;
  if (!filename) {
    process.stderr.write(`[sdd-forge] log write skipped: ${log.constructor.name} has no static filename\n`);
    return;
  }
  try {
    await fs.promises.mkdir(logDir, { recursive: true });
    const logFile = path.join(logDir, filename);
    await fs.promises.appendFile(logFile, JSON.stringify(log.toJSON()) + "\n", "utf8");
  } catch (err) {
    process.stderr.write(`[sdd-forge] log write failed: ${err.message}\n`);
  }
}

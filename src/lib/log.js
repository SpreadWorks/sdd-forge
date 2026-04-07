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
 *   - finalize()       — called by Logger.log() before writing (optional)
 */
export class Log {
  static filename = undefined;

  isEnabled(_cfg) {
    return true;
  }

  toJSON() {
    return {};
  }

  finalize() {}
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
export async function writeLogEntry(log, cwd, cfg) {
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

/**
 * Singleton logger that holds cwd/cfg after init, so call sites only need `Logger.getInstance().log(entry)`.
 */
export class Logger {
  static #instance = null;

  #cwd = null;
  #cfg = null;
  #initialized = false;

  static getInstance() {
    if (!Logger.#instance) Logger.#instance = new Logger();
    return Logger.#instance;
  }

  /** @internal Reset singleton for testing. */
  static _resetForTest() {
    Logger.#instance = null;
  }

  get initialized() {
    return this.#initialized;
  }

  init(cwd, cfg) {
    this.#cwd = cwd;
    this.#cfg = cfg;
    this.#initialized = true;
  }

  async log(entry) {
    if (!this.#initialized) {
      process.stderr.write("[sdd-forge] Logger not initialized — call Logger.getInstance().init(cwd, cfg) first. Log skipped.\n");
      return;
    }
    entry.finalize();
    await writeLogEntry(entry, this.#cwd, this.#cfg);
  }
}

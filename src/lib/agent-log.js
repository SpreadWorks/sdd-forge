/**
 * sdd-forge/lib/agent-log.js
 *
 * AgentLog — records agent invocation metadata and appends it to a JSONL log file.
 */

import fs from "fs";
import path from "path";
import { isInsideWorktree, getMainRepoPath } from "./cli.js";

export class AgentLog {
  /**
   * @param {Object} [opts]
   * @param {string|null} [opts.spec]  - Spec name (e.g. "148-save-agent-prompt-logs")
   * @param {string|null} [opts.phase] - Flow phase (e.g. "spec", "draft")
   */
  constructor({ spec = null, phase = null } = {}) {
    this.spec = spec;
    this.phase = phase;
    /** @type {Date|null} */ this.executeStartAt = null;
    /** @type {Date|null} */ this.executeEndAt = null;
    /** @type {number|null} */ this.executeTime = null;
    /** @type {string|null} */ this.prompt = null;
  }

  /**
   * Serialize to log entry object (ISO 8601 dates, numeric executeTime).
   * @returns {Object}
   */
  toJSON() {
    return {
      executeStartAt: this.executeStartAt?.toISOString() ?? null,
      executeEndAt: this.executeEndAt?.toISOString() ?? null,
      executeTime: this.executeTime,
      spec: this.spec,
      phase: this.phase,
      prompt: this.prompt,
    };
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
 * Append an AgentLog entry to the JSONL log file.
 * Silently writes errors to stderr — never throws.
 *
 * @param {AgentLog} agentLog
 * @param {string|null} cwd
 * @param {Object} cfg
 */
export function appendAgentLog(agentLog, cwd, cfg) {
  if (!cfg?.logs?.prompts) return;
  const logDir = resolveLogDir(cwd, cfg);
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, "prompts.jsonl");
    fs.appendFileSync(logFile, JSON.stringify(agentLog.toJSON()) + "\n", "utf8");
  } catch (err) {
    process.stderr.write(`[sdd-forge] agent-log write failed: ${err.message}\n`);
  }
}

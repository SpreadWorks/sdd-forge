/**
 * sdd-forge/lib/agent-log.js
 *
 * AgentLog — records agent invocation metadata and appends it to a JSONL log file.
 */

import { Log } from "./log.js";

export class AgentLog extends Log {
  static filename = "prompts.jsonl";

  /**
   * @param {Object} [opts]
   * @param {string|null} [opts.spec]  - Spec name (e.g. "148-save-agent-prompt-logs")
   * @param {string|null} [opts.phase] - Flow phase (e.g. "spec", "draft")
   */
  constructor({ spec = null, phase = null } = {}) {
    super();
    this.spec = spec;
    this.phase = phase;
    /** @type {Date|null} */ this.executeStartAt = null;
    /** @type {Date|null} */ this.executeEndAt = null;
    /** @type {number|null} */ this.executeTime = null;
    /** @type {string|null} */ this.prompt = null;
  }

  isEnabled(cfg) {
    return Boolean(cfg?.logs?.prompts);
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

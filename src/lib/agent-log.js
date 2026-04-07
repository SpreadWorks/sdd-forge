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
   * @param {string|null} [opts.prompt] - The prompt text sent to the agent
   */
  constructor({ spec = null, phase = null, prompt = null } = {}) {
    super();
    this.spec = spec;
    this.phase = phase;
    /** @type {Date} */ this.executeStartAt = new Date();
    /** @type {Date|null} */ this.executeEndAt = null;
    /** @type {number|null} */ this.executeTime = null;
    /** @type {string|null} */ this.prompt = prompt;
  }

  isEnabled(cfg) {
    return Boolean(cfg?.logs?.prompts);
  }

  finalize() {
    this.executeEndAt = new Date();
    this.executeTime = (this.executeEndAt - this.executeStartAt) / 1000;
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

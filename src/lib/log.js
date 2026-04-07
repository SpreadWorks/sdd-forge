/**
 * sdd-forge/lib/log.js
 *
 * Unified JSONL logger for sdd-forge.
 *
 * Two-tier output:
 *   - Daily JSONL `<logDir>/sdd-forge-YYYY-MM-DD.jsonl` (lightweight metadata)
 *   - Per-request prompt JSON `<logDir>/prompts/YYYY-MM-DD/<requestId>.json` (heavy bodies)
 *
 * Three domains exposed via the singleton instance:
 *   - Logger.getInstance().agent({ phase: "start"|"end", requestId, ... })
 *   - Logger.getInstance().git({ cmd, exitCode, stderr })
 *   - Logger.getInstance().event(name, fields)
 *
 * The logger is opt-in via `cfg.logs.enabled === true`. When disabled or
 * uninitialized, all methods are no-ops (no I/O, no throws).
 *
 * `spec` and `sddPhase` for agent end events are auto-resolved from flow-state
 * at log time, so call sites do not need to pass them.
 *
 * See spec 153-unified-jsonl-logger for the design rationale.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { isInsideWorktree, getMainRepoPath } from "./cli.js";

// ─── Internal helpers ──────────────────────────────────────────────────────

/**
 * Resolve log directory from config.
 * Uses logs.dir if set; otherwise falls back to {agent.workDir}/logs relative to cwd.
 * When called from inside a git worktree, writes to the main repo side.
 */
function resolveLogDir(cwd, cfg) {
  if (cfg?.logs?.dir) return cfg.logs.dir;
  const workDir = cfg?.agent?.workDir || ".tmp";
  const root = path.resolve(cwd || process.cwd());
  const repoRoot = isInsideWorktree(root) ? getMainRepoPath(root) : root;
  return path.join(repoRoot, workDir, "logs");
}

/** YYYY-MM-DD in local time, computed at write time. */
function todayLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Generate an 8-character lowercase hex requestId. */
export function generateRequestId() {
  return crypto.randomBytes(4).toString("hex");
}

/** Compute character / line counts for a string (used for prompt stats). */
function textStats(s) {
  if (s == null) return { chars: 0, lines: 0 };
  const str = String(s);
  return {
    chars: str.length,
    lines: str.length === 0 ? 0 : str.split("\n").length,
  };
}

/**
 * Extract the first stack frame outside of this file.
 * Returns { callerFile, callerLine } or { callerFile: null, callerLine: null }.
 */
function extractCaller() {
  const err = new Error();
  const stack = err.stack || "";
  const lines = stack.split("\n").slice(1); // skip "Error"
  for (const line of lines) {
    // Match formats:  "    at fn (/path/file.js:12:34)"  or  "    at /path/file.js:12:34"
    const m = line.match(/\(([^()]+):(\d+):(\d+)\)\s*$/) || line.match(/at\s+([^\s()]+):(\d+):(\d+)\s*$/);
    if (!m) continue;
    let file = m[1];
    if (file.startsWith("file://")) {
      try { file = new URL(file).pathname; } catch { /* keep as-is */ }
    }
    // Skip frames inside this file
    if (file.endsWith("/lib/log.js") || file.endsWith("\\lib\\log.js")) continue;
    return { callerFile: file, callerLine: Number(m[2]) };
  }
  return { callerFile: null, callerLine: null };
}

/**
 * Append a JSON object as one line to the given file. I/O failures are
 * reported to stderr; never throws.
 */
async function appendJsonl(file, obj) {
  try {
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.appendFile(file, JSON.stringify(obj) + "\n", "utf8");
  } catch (err) {
    process.stderr.write(`[sdd-forge] log write failed: ${err.message}\n`);
  }
}

/** Write a self-contained prompt JSON file. Returns the absolute path or null on failure. */
async function writePromptFile(promptDir, requestId, payload) {
  const file = path.join(promptDir, `${requestId}.json`);
  try {
    await fs.promises.mkdir(promptDir, { recursive: true });
    await fs.promises.writeFile(file, JSON.stringify(payload, null, 2) + "\n", "utf8");
    return file;
  } catch (err) {
    process.stderr.write(`[sdd-forge] prompt file write failed: ${err.message}\n`);
    return null;
  }
}

/**
 * Resolve { spec, sddPhase } from flow-state for the current cwd.
 *
 * - Returns { spec: null, sddPhase: null } as the normal "no active flow" case
 *   (e.g. running sdd-forge outside a spec). This is expected, not an error.
 * - Unexpected errors (corrupted flow.json, FS errors) are reported to stderr
 *   so they are not silently swallowed.
 *
 * Lazy import to avoid pulling flow-state on the hot path before it is needed.
 */
async function resolveFlowContext(cwd) {
  let mod;
  try {
    mod = await import("./flow-state.js");
  } catch (err) {
    process.stderr.write(`[sdd-forge] Logger: failed to load flow-state: ${err.message}\n`);
    return { spec: null, sddPhase: null };
  }
  try {
    const state = mod.loadFlowState(cwd);
    if (!state) return { spec: null, sddPhase: null }; // expected: outside any spec
    const spec = mod.specIdFromPath(state.spec) ?? null;
    const inProgress = state.steps?.find?.((s) => s.status === "in_progress");
    const sddPhase = inProgress?.id ?? null;
    return { spec, sddPhase };
  } catch (err) {
    process.stderr.write(`[sdd-forge] Logger: flow-state read failed: ${err.message}\n`);
    return { spec: null, sddPhase: null };
  }
}

// ─── Logger singleton ──────────────────────────────────────────────────────

/**
 * Singleton logger holding cwd / cfg / entryCommand after init.
 * Disabled (or uninitialized) → all log methods are no-ops.
 */
export class Logger {
  static #instance = null;

  #cwd = null;
  #cfg = null;
  #entryCommand = null;
  #initialized = false;
  #pending = new Set();

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

  /**
   * Initialize the logger. Called once at the sdd-forge entrypoint.
   * Safe to call when cfg.logs.enabled is false — methods become no-ops.
   *
   * @param {string} cwd
   * @param {Object} cfg
   * @param {Object} [opts]
   * @param {string} [opts.entryCommand] - User-typed command, e.g. "flow run gate"
   */
  init(cwd, cfg, opts = {}) {
    this.#cwd = cwd;
    this.#cfg = cfg;
    this.#entryCommand = opts.entryCommand ?? null;
    this.#initialized = true;
  }

  /**
   * Wait for all in-flight log writes (including fire-and-forget ones started
   * by `callAgentWithLog`) to settle. Useful in tests to avoid timing-based
   * waits when the caller does not await Logger calls directly.
   */
  async flush() {
    while (this.#pending.size > 0) {
      const snapshot = [...this.#pending];
      await Promise.allSettled(snapshot);
    }
  }

  /** Track an in-flight write so flush() can wait for it. */
  #track(p) {
    this.#pending.add(p);
    p.finally(() => this.#pending.delete(p));
    return p;
  }

  /** True iff Logger is initialized AND cfg.logs.enabled === true. */
  #isActive() {
    if (!this.#initialized) return false;
    return this.#cfg?.logs?.enabled === true;
  }

  #commonFields() {
    return {
      ts: new Date().toISOString(),
      entryCommand: this.#entryCommand,
      pid: process.pid,
    };
  }

  #logFile() {
    const dir = resolveLogDir(this.#cwd, this.#cfg);
    return {
      dir,
      jsonl: path.join(dir, `sdd-forge-${todayLocal()}.jsonl`),
      promptDir: path.join(dir, "prompts", todayLocal()),
    };
  }

  /**
   * Record an agent invocation event.
   *
   * For phase "start", only minimal fields are written (hang detection marker).
   * For phase "end", a denormalized rich record is written and a self-contained
   * prompt JSON file is created under prompts/YYYY-MM-DD/<requestId>.json.
   *
   * @param {Object} entry
   * @param {"start"|"end"} entry.phase
   * @param {string} entry.requestId
   * @param {string} [entry.agentKey]
   * @param {string} [entry.model]
   * @param {{system?: string, user?: string}} [entry.prompt]
   * @param {{text?: string, exitCode?: number, error?: string|null}} [entry.response]
   * @param {number} [entry.durationSec]
   */
  agent(entry) {
    return this.#track(this.#agentImpl(entry));
  }

  async #agentImpl(entry) {
    if (!this.#initialized) {
      process.stderr.write(
        "[sdd-forge] Logger not initialized — call Logger.getInstance().init(cwd, cfg) first. Log skipped.\n",
      );
      return;
    }
    if (!this.#isActive()) return;
    if (!entry || (entry.phase !== "start" && entry.phase !== "end")) return;

    const { jsonl, promptDir } = this.#logFile();
    const caller = extractCaller();

    if (entry.phase === "start") {
      // Start events do not need spec/sddPhase, so skip the flow-state read.
      const line = {
        ...this.#commonFields(),
        type: "agent",
        phase: "start",
        requestId: entry.requestId,
        callerFile: caller.callerFile,
        callerLine: caller.callerLine,
      };
      await appendJsonl(jsonl, line);
      return;
    }

    // phase === "end" — resolve flow context now (only when needed).
    const ctx = await resolveFlowContext(this.#cwd);
    const promptObj = entry.prompt || {};
    const responseObj = entry.response || {};
    const systemStats = textStats(promptObj.system);
    const userStats = textStats(promptObj.user);
    const totalChars = systemStats.chars + userStats.chars;
    const totalLines = systemStats.lines + userStats.lines;
    const responseStats = textStats(responseObj.text);

    const promptPayload = {
      requestId: entry.requestId,
      ts: new Date().toISOString(),
      context: {
        entryCommand: this.#entryCommand,
        spec: ctx.spec,
        sddPhase: ctx.sddPhase,
        callerFile: caller.callerFile,
        callerLine: caller.callerLine,
      },
      agent: {
        key: entry.agentKey ?? null,
        model: entry.model ?? null,
      },
      prompt: {
        system: promptObj.system ?? null,
        user: promptObj.user ?? null,
        stats: {
          systemChars: systemStats.chars,
          userChars: userStats.chars,
          totalChars,
          totalLines,
        },
      },
      response: {
        text: responseObj.text ?? null,
        stats: {
          chars: responseStats.chars,
          lines: responseStats.lines,
        },
        exitCode: responseObj.exitCode ?? null,
        error: responseObj.error ?? null,
      },
      execution: {
        durationSec: entry.durationSec ?? null,
      },
    };

    const promptFileAbs = await writePromptFile(promptDir, entry.requestId, promptPayload);
    // Record promptFile as a path relative to cwd so it can be opened from the project root.
    const promptFileRel = promptFileAbs
      ? path.relative(this.#cwd || process.cwd(), promptFileAbs).split(path.sep).join("/")
      : null;

    const line = {
      ...this.#commonFields(),
      type: "agent",
      phase: "end",
      requestId: entry.requestId,
      spec: ctx.spec,
      sddPhase: ctx.sddPhase,
      callerFile: caller.callerFile,
      callerLine: caller.callerLine,
      agentKey: entry.agentKey ?? null,
      model: entry.model ?? null,
      promptChars: totalChars,
      systemChars: systemStats.chars,
      userChars: userStats.chars,
      promptLines: totalLines,
      responseChars: responseStats.chars,
      responseLines: responseStats.lines,
      durationSec: entry.durationSec ?? null,
      exitCode: responseObj.exitCode ?? null,
      promptFile: promptFileRel,
    };
    await appendJsonl(jsonl, line);
  }

  /**
   * Record a git command execution.
   * @param {Object} entry
   * @param {string[]} entry.cmd
   * @param {number} entry.exitCode
   * @param {string} [entry.stderr]
   */
  git(entry) {
    return this.#track(this.#gitImpl(entry));
  }

  async #gitImpl(entry) {
    if (!this.#isActive()) return;
    const { jsonl } = this.#logFile();
    const caller = extractCaller();
    const line = {
      ...this.#commonFields(),
      type: "git",
      cmd: entry?.cmd ?? null,
      exitCode: entry?.exitCode ?? null,
      stderr: entry?.stderr ?? "",
      callerFile: caller.callerFile,
      callerLine: caller.callerLine,
    };
    await appendJsonl(jsonl, line);
  }

  /**
   * Record an arbitrary named event with free-form fields.
   * @param {string} name
   * @param {Object} [fields]
   */
  event(name, fields = {}) {
    return this.#track(this.#eventImpl(name, fields));
  }

  async #eventImpl(name, fields = {}) {
    if (!this.#isActive()) return;
    const { jsonl } = this.#logFile();
    const caller = extractCaller();
    const line = {
      ...this.#commonFields(),
      type: "event",
      name,
      ...fields,
      callerFile: caller.callerFile,
      callerLine: caller.callerLine,
    };
    await appendJsonl(jsonl, line);
  }
}

/**
 * src/flow/set/issue-log.js
 *
 * flow set issue-log --step X --reason Y [--trigger Z] [--resolution W] [--guardrail-candidate G]
 * Record an issue-log entry in specs/<spec>/issue-log.json.
 */

import fs from "fs";
import path from "path";
import { parseArgs } from "../../lib/cli.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

/**
 * @typedef {Object} IssueLogEntry
 * @property {string} step - Step ID where the issue occurred
 * @property {string} reason - Why the entry was recorded
 * @property {string} [trigger] - What triggered the issue (e.g. user correction)
 * @property {string} [resolution] - How the issue was resolved
 * @property {string} [guardrailCandidate] - Potential guardrail article to add
 * @property {string} timestamp - ISO 8601 timestamp
 */

/**
 * @typedef {Object} IssueLog
 * @property {IssueLogEntry[]} entries
 */

/**
 * Load issue-log.json from specs/<spec>/ directory.
 * @param {string} root - project root
 * @param {string} specPath - relative spec path (e.g. "specs/095-xxx/spec.md")
 * @returns {IssueLog}
 */
function loadIssueLog(root, specPath) {
  const specDir = path.dirname(path.resolve(root, specPath));
  const logPath = path.join(specDir, "issue-log.json");
  if (fs.existsSync(logPath)) {
    const raw = JSON.parse(fs.readFileSync(logPath, "utf8"));
    if (!raw.entries || !Array.isArray(raw.entries)) {
      throw new Error(`Invalid issue-log.json: "entries" must be an array`);
    }
    return raw;
  }
  return { entries: [] };
}

/**
 * Save issue-log.json to specs/<spec>/ directory.
 * @param {string} root - project root
 * @param {string} specPath - relative spec path
 * @param {IssueLog} issueLog
 */
function saveIssueLog(root, specPath, issueLog) {
  const specDir = path.dirname(path.resolve(root, specPath));
  const logPath = path.join(specDir, "issue-log.json");
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(issueLog, null, 2) + "\n");
}

export async function execute(ctx) {
  const args = ctx.args;

  let opts;
  try {
    opts = parseArgs(args, {
      options: ["--step", "--reason", "--trigger", "--resolution", "--guardrail-candidate"],
    });
  } catch (e) {
    output(fail("set", "issue-log", "INVALID_ARGS", e.message));
    return;
  }

  if (opts.help) {
    console.log("Usage: flow set issue-log --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]");
    process.exit(0);
    return;
  }

  if (!opts.step || !opts.reason) {
    output(fail("set", "issue-log", "MISSING_ARGS", "--step and --reason are required"));
    return;
  }

  /** @type {IssueLogEntry} */
  const entry = {
    step: opts.step,
    reason: opts.reason,
    ...(opts.trigger && { trigger: opts.trigger }),
    ...(opts.resolution && { resolution: opts.resolution }),
    ...(opts.guardrailCandidate && { guardrailCandidate: opts.guardrailCandidate }),
    timestamp: new Date().toISOString(),
  };

  const { root } = ctx;

  try {
    const state = ctx.flowState;
    if (!state) {
      output(fail("set", "issue-log", "NO_FLOW", "no active flow (flow.json not found)"));
      return;
    }

    const issueLog = loadIssueLog(root, state.spec);
    issueLog.entries.push(entry);
    saveIssueLog(root, state.spec, issueLog);

    output(ok("set", "issue-log", { entry, total: issueLog.entries.length }));
  } catch (e) {
    output(fail("set", "issue-log", "SET_FAILED", e.message));
  }
}

export { loadIssueLog, saveIssueLog };

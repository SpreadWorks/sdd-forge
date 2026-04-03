/**
 * src/flow/lib/set-issue-log.js
 *
 * Record an issue-log entry in specs/<spec>/issue-log.json.
 *
 * ctx.step               — step ID (required)
 * ctx.reason             — why the entry was recorded (required)
 * ctx.trigger            — what triggered the issue (optional)
 * ctx.resolution         — how the issue was resolved (optional)
 * ctx.guardrailCandidate — potential guardrail article to add (optional)
 */

import fs from "fs";
import path from "path";
import { FlowCommand } from "./base-command.js";

/**
 * Load issue-log.json from specs/<spec>/ directory.
 * @param {string} root - project root
 * @param {string} specPath - relative spec path
 * @returns {{ entries: Object[] }}
 */
export function loadIssueLog(root, specPath) {
  const specDir = path.dirname(path.resolve(root, specPath));
  const logPath = path.join(specDir, "issue-log.json");
  if (fs.existsSync(logPath)) {
    const raw = JSON.parse(fs.readFileSync(logPath, "utf8"));
    if (!raw.entries || !Array.isArray(raw.entries)) {
      throw new Error('Invalid issue-log.json: "entries" must be an array');
    }
    return raw;
  }
  return { entries: [] };
}

/**
 * Save issue-log.json to specs/<spec>/ directory.
 * @param {string} root - project root
 * @param {string} specPath - relative spec path
 * @param {{ entries: Object[] }} issueLog
 */
export function saveIssueLog(root, specPath, issueLog) {
  const specDir = path.dirname(path.resolve(root, specPath));
  const logPath = path.join(specDir, "issue-log.json");
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(issueLog, null, 2) + "\n");
}

export default class SetIssueLogCommand extends FlowCommand {
  execute(ctx) {
    const { root } = ctx;

    if (!ctx.step || !ctx.reason) {
      throw new Error("--step and --reason are required");
    }

    const entry = {
      step: ctx.step,
      reason: ctx.reason,
      ...(ctx.trigger && { trigger: ctx.trigger }),
      ...(ctx.resolution && { resolution: ctx.resolution }),
      ...(ctx.guardrailCandidate && { guardrailCandidate: ctx.guardrailCandidate }),
      timestamp: new Date().toISOString(),
    };

    const state = ctx.flowState;
    const issueLog = loadIssueLog(root, state.spec);
    issueLog.entries.push(entry);
    saveIssueLog(root, state.spec, issueLog);

    return { entry, total: issueLog.entries.length };
  }
}

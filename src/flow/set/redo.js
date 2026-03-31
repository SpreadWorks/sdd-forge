#!/usr/bin/env node
/**
 * src/flow/set/redo.js
 *
 * flow set redo --step X --reason Y [--trigger Z] [--resolution W] [--guardrail-candidate G]
 * Record a redo entry in specs/<spec>/redolog.json.
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

/**
 * @typedef {Object} RedoLogEntry
 * @property {string} step - Step ID where the redo occurred
 * @property {string} reason - Why the redo was needed
 * @property {string} [trigger] - What triggered the redo (e.g. user correction)
 * @property {string} [resolution] - How the redo was resolved
 * @property {string} [guardrailCandidate] - Potential guardrail article to add
 * @property {string} timestamp - ISO 8601 timestamp
 */

/**
 * @typedef {Object} RedoLog
 * @property {RedoLogEntry[]} entries
 */

/**
 * Load redolog.json from specs/<spec>/ directory.
 * @param {string} root - project root
 * @param {string} specPath - relative spec path (e.g. "specs/095-xxx/spec.md")
 * @returns {RedoLog}
 */
function loadRedoLog(root, specPath) {
  const specDir = path.dirname(path.resolve(root, specPath));
  const redoPath = path.join(specDir, "redolog.json");
  if (fs.existsSync(redoPath)) {
    const raw = JSON.parse(fs.readFileSync(redoPath, "utf8"));
    if (!raw.entries || !Array.isArray(raw.entries)) {
      throw new Error(`Invalid redolog.json: "entries" must be an array`);
    }
    return raw;
  }
  return { entries: [] };
}

/**
 * Save redolog.json to specs/<spec>/ directory.
 * @param {string} root - project root
 * @param {string} specPath - relative spec path
 * @param {RedoLog} redoLog
 */
function saveRedoLog(root, specPath, redoLog) {
  const specDir = path.dirname(path.resolve(root, specPath));
  const redoPath = path.join(specDir, "redolog.json");
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(redoPath, JSON.stringify(redoLog, null, 2) + "\n");
}

function main() {
  const args = process.argv.slice(2);

  let opts;
  try {
    opts = parseArgs(args, {
      options: ["--step", "--reason", "--trigger", "--resolution", "--guardrail-candidate"],
    });
  } catch (e) {
    output(fail("set", "redo", "INVALID_ARGS", e.message));
    return;
  }

  if (opts.help) {
    console.log("Usage: flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]");
    process.exit(0);
    return;
  }

  if (!opts.step || !opts.reason) {
    output(fail("set", "redo", "MISSING_ARGS", "--step and --reason are required"));
    return;
  }

  /** @type {RedoLogEntry} */
  const entry = {
    step: opts.step,
    reason: opts.reason,
    ...(opts.trigger && { trigger: opts.trigger }),
    ...(opts.resolution && { resolution: opts.resolution }),
    ...(opts.guardrailCandidate && { guardrailCandidate: opts.guardrailCandidate }),
    timestamp: new Date().toISOString(),
  };

  const root = repoRoot(import.meta.url);

  try {
    const state = loadFlowState(root);
    if (!state) {
      output(fail("set", "redo", "NO_FLOW", "no active flow (flow.json not found)"));
      return;
    }

    const redoLog = loadRedoLog(root, state.spec);
    redoLog.entries.push(entry);
    saveRedoLog(root, state.spec, redoLog);

    output(ok("set", "redo", { entry, total: redoLog.entries.length }));
  } catch (e) {
    output(fail("set", "redo", "SET_FAILED", e.message));
  }
}

export { main, loadRedoLog, saveRedoLog };
runIfDirect(import.meta.url, main);

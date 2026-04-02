/**
 * src/flow/run/report.js
 *
 * Generate a work report from finalize pipeline data.
 * Called by finalize.js Step 6 (report).
 */

import fs from "fs";
import path from "path";
import { loadRedoLog } from "../set/redo.js";

/**
 * Aggregate metrics across all phases.
 * @param {Object|null} metrics - flow.json metrics object keyed by phase
 * @returns {{ docsRead: number, srcRead: number, question: number, redo: number }}
 */
function aggregateMetrics(metrics) {
  const totals = { docsRead: 0, srcRead: 0, question: 0, redo: 0 };
  if (!metrics) return totals;
  for (const phase of Object.values(metrics)) {
    if (!phase || typeof phase !== "object") continue;
    for (const key of Object.keys(totals)) {
      totals[key] += phase[key] || 0;
    }
  }
  return totals;
}

/**
 * Build the structured report data object.
 * @param {Object} input
 * @param {Object} input.state - flow.json state
 * @param {Object} input.results - finalize step results
 * @param {Object} input.redolog - redolog data { entries: [] }
 * @param {string} input.implDiffStat - git diff --stat output for implementation
 * @param {string[]} input.commitMessages - commit messages from feature branch
 * @returns {{ data: Object, text: string }}
 */
export function generateReport(input) {
  const { state, results, redolog, implDiffStat, commitMessages } = input;

  // Implementation
  const implementation = {
    diffStat: implDiffStat || null,
    commits: commitMessages || [],
  };

  // Retro
  const retroResult = results.retro;
  const retro = (retroResult && retroResult.status === "done" && retroResult.summary)
    ? retroResult.summary
    : null;

  // Redolog
  const entries = redolog?.entries || [];
  const redologData = {
    count: entries.length,
    entries: entries.map(e => ({
      step: e.step,
      reason: e.reason,
      resolution: e.resolution || null,
    })),
  };

  // Metrics
  const metrics = aggregateMetrics(state.metrics);

  // Sync
  let sync;
  const syncResult = results.sync;
  if (!syncResult || syncResult.status === "skipped") {
    sync = {
      status: "skipped",
      reason: syncResult?.message || "sync was skipped",
    };
  } else if (syncResult.status === "done") {
    sync = {
      status: "done",
      diffStat: syncResult.diffStat || null,
      diffSummary: syncResult.diffSummary || null,
    };
  } else {
    sync = {
      status: syncResult.status || "unknown",
      reason: syncResult.message || null,
    };
  }

  const data = { implementation, retro, redolog: redologData, metrics, sync };
  const text = formatText(data);

  return { data, text };
}

/**
 * Format report data as human-readable plain text.
 * @param {Object} data - structured report data
 * @returns {string}
 */
function formatText(data) {
  const lines = [];
  const sep = "──────────────────────────────────────────────────────────";

  // Implementation
  lines.push(sep);
  lines.push("  Implementation");
  lines.push(sep);
  if (data.implementation.commits.length > 0) {
    lines.push("");
    lines.push("  Commits:");
    for (const msg of data.implementation.commits) {
      lines.push(`    - ${msg}`);
    }
  }
  if (data.implementation.diffStat) {
    lines.push("");
    lines.push("  Changes:");
    for (const line of data.implementation.diffStat.split("\n")) {
      lines.push(`    ${line}`);
    }
  }

  // Retro
  lines.push("");
  lines.push(sep);
  lines.push("  Retro");
  lines.push(sep);
  if (data.retro) {
    const r = data.retro;
    lines.push("");
    lines.push(`  Completion: ${(r.rate * 100).toFixed(0)}% (${r.done}/${r.total})`);
    lines.push(`    done: ${r.done}  partial: ${r.partial}  not_done: ${r.not_done}`);
  } else {
    lines.push("");
    lines.push("  (not available)");
  }

  // Redo
  lines.push("");
  lines.push(sep);
  lines.push("  Redo");
  lines.push(sep);
  lines.push("");
  lines.push(`  Total: ${data.redolog.count}`);
  if (data.redolog.entries.length > 0) {
    for (const e of data.redolog.entries) {
      lines.push(`    [${e.step}] ${e.reason}${e.resolution ? ` → ${e.resolution}` : ""}`);
    }
  }

  // Metrics
  lines.push("");
  lines.push(sep);
  lines.push("  Metrics");
  lines.push(sep);
  lines.push("");
  lines.push(`  docs read: ${data.metrics.docsRead}  src read: ${data.metrics.srcRead}  questions: ${data.metrics.question}  redos: ${data.metrics.redo}`);

  // Sync
  lines.push("");
  lines.push(sep);
  lines.push("  Sync");
  lines.push(sep);
  if (data.sync.status === "skipped") {
    lines.push("");
    lines.push(`  Skipped: ${data.sync.reason}`);
  } else if (data.sync.status === "done") {
    if (data.sync.diffStat) {
      lines.push("");
      lines.push("  Docs changes:");
      for (const line of data.sync.diffStat.split("\n")) {
        lines.push(`    ${line}`);
      }
    }
    if (data.sync.diffSummary) {
      lines.push("");
      lines.push("  Summary:");
      lines.push(`    ${data.sync.diffSummary}`);
    }
  } else {
    lines.push("");
    lines.push(`  Status: ${data.sync.status}`);
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Save report.json to the spec directory.
 * @param {string} root - project root
 * @param {string} specPath - relative spec path
 * @param {Object} reportData - { data, text }
 */
export function saveReport(root, specPath, reportData) {
  const specDir = path.dirname(path.resolve(root, specPath));
  const reportPath = path.join(specDir, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2) + "\n");
}

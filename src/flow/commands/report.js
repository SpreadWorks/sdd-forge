/**
 * src/flow/run/report.js
 *
 * Generate a work report from finalize pipeline data.
 * Called by finalize.js Step 6 (report).
 */

import fs from "fs";
import path from "path";
import { loadIssueLog } from "../set/issue-log.js";

/**
 * Aggregate metrics across all phases.
 * @param {Object|null} metrics - flow.json metrics object keyed by phase
 * @returns {{ docsRead: number, srcRead: number, question: number, redo: number }}
 */
function aggregateMetrics(metrics) {
  const totals = { docsRead: 0, srcRead: 0, question: 0, issueLog: 0 };
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
 * @param {Object} input.issueLog - issue-log data { entries: [] }
 * @param {string} input.implDiffStat - git diff --stat output for implementation
 * @param {string[]} input.commitMessages - commit messages from feature branch
 * @returns {{ data: Object, text: string }}
 */
export function generateReport(input) {
  const { state, results, issueLog, implDiffStat, commitMessages } = input;

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
  const entries = issueLog?.entries || [];
  const issueLogData = {
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

  // Tests (R1, R3)
  const testSummary = state.metrics?.test?.summary;
  let tests = null;
  if (testSummary) {
    const unit = testSummary.unit || 0;
    const integration = testSummary.integration || 0;
    const acceptance = testSummary.acceptance || 0;
    tests = { unit, integration, acceptance, total: unit + integration + acceptance };
  }

  const data = { implementation, retro, issueLog: issueLogData, metrics, tests, sync };
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
  const thin = "────────────────────────────────────────────────";

  lines.push("  Report");

  // Implementation
  lines.push("");
  lines.push(`  Implementation`);
  lines.push(`  ${thin}`);
  if (data.implementation.commits.length > 0) {
    for (const msg of data.implementation.commits) {
      lines.push(`    ${msg}`);
    }
  }
  if (data.implementation.diffStat) {
    const last = data.implementation.diffStat.split("\n").pop()?.trim();
    if (last) lines.push(`    ${last}`);
  }
  if (!data.implementation.commits.length && !data.implementation.diffStat) {
    lines.push("    -");
  }

  // Retro
  lines.push("");
  lines.push("  Retro");
  lines.push(`  ${thin}`);
  if (data.retro) {
    const r = data.retro;
    const pct = (r.rate * 100).toFixed(0);
    const bar8 = Math.round(r.rate * 8);
    const filled = "\u2588".repeat(bar8);
    const empty = "\u2591".repeat(8 - bar8);
    lines.push(`    ${filled}${empty} ${pct}%  (${r.done} done / ${r.partial} partial / ${r.not_done} miss)`);
  } else {
    lines.push("    -");
  }

  // Metrics (single line)
  lines.push("");
  lines.push("  Metrics");
  lines.push(`  ${thin}`);
  const m = data.metrics;
  lines.push(`    docs ${m.docsRead}  src ${m.srcRead}  Q&A ${m.question}  issues ${m.issueLog}`);

  // Tests
  if (data.tests) {
    lines.push("");
    lines.push("  Tests");
    lines.push(`  ${thin}`);
    const t = data.tests;
    lines.push(`    unit ${t.unit}  integration ${t.integration}  acceptance ${t.acceptance}  total ${t.total}`);
  }

  // Redo (only if entries exist)
  if (data.issueLog.count > 0) {
    lines.push("");
    lines.push(`  Issue Log (${data.issueLog.count})`);
    lines.push(`  ${thin}`);
    for (const e of data.issueLog.entries) {
      lines.push(`    [${e.step}] ${e.reason}${e.resolution ? ` -> ${e.resolution}` : ""}`);
    }
  }

  // Documents
  lines.push("");
  lines.push("  Documents");
  lines.push(`  ${thin}`);
  if (data.sync.status === "skipped") {
    lines.push(`    skipped: ${data.sync.reason}`);
  } else if (data.sync.status === "done") {
    if (data.sync.diffSummary) {
      for (const f of data.sync.diffSummary.split("\n").filter(Boolean)) {
        lines.push(`    ${f}`);
      }
    }
    if (data.sync.diffStat) {
      const last = data.sync.diffStat.split("\n").pop()?.trim();
      if (last) lines.push(`    ${last}`);
    }
  } else {
    lines.push(`    ${data.sync.status}${data.sync.reason ? ": " + data.sync.reason : ""}`);
  }

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

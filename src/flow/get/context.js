#!/usr/bin/env node
/**
 * src/flow/get/context.js
 *
 * flow get context [path] [--raw]
 *
 * List mode (no path): Return filtered analysis entries (file, summary, methods, chapter, role).
 * File mode (with path): Return file content + increment docsRead/srcRead metric.
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { sddOutputDir } from "../../lib/config.js";
import { loadFlowState, mutateFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import { ANALYSIS_META_KEYS } from "../../docs/lib/analysis-entry.js";
import { EXIT_ERROR } from "../../lib/exit-codes.js";

const EXCLUDE_FIELDS = new Set(["hash", "mtime", "lines", "id", "enrich", "detail"]);

/**
 * Search analysis entries by keyword matching against the keywords array.
 * @param {Object[]} entries - Analysis entries (with keywords, summary, detail, etc.)
 * @param {string} query - Search query string
 * @returns {Object[]} Matched entries with file, summary, detail, keywords, chapter, role
 */
function searchEntries(entries, query) {
  const q = query.toLowerCase();
  return entries
    .filter((e) => {
      if (!Array.isArray(e.keywords)) return false;
      return e.keywords.some((kw) => String(kw).toLowerCase().includes(q));
    })
    .map((e) => ({
      file: e.file,
      summary: e.summary || null,
      detail: e.detail || null,
      keywords: e.keywords,
      chapter: e.chapter || null,
      role: e.role || null,
    }));
}

function filterEntry(entry) {
  const filtered = {};
  for (const [k, v] of Object.entries(entry)) {
    if (EXCLUDE_FIELDS.has(k)) continue;
    filtered[k] = v;
  }
  if (!filtered.summary) {
    filtered.needsSource = true;
  }
  return filtered;
}

function resolvePhase(state) {
  if (!state?.steps) return null;
  const active = state.steps.find((s) => s.status === "in_progress");
  if (active) {
    const id = active.id;
    if (["draft", "spec", "gate", "test"].includes(id)) return id;
    if (["implement", "review", "finalize"].includes(id)) return "impl";
  }
  return null;
}

function incrementMetric(root, phase, counter) {
  if (!phase) return;
  try {
    mutateFlowState(root, (state) => {
      if (!state.metrics) state.metrics = {};
      if (!state.metrics[phase]) state.metrics[phase] = {};
      state.metrics[phase][counter] = (state.metrics[phase][counter] || 0) + 1;
    });
  } catch (_) {
    // flow.json may not exist outside a flow
  }
}

function main() {
  const root = repoRoot(import.meta.url);
  const rawArgs = process.argv.slice(2);
  const isHelp = rawArgs.includes("-h") || rawArgs.includes("--help");
  const isRaw = rawArgs.includes("--raw");
  const searchIdx = rawArgs.indexOf("--search");
  const searchQuery = searchIdx !== -1 ? rawArgs[searchIdx + 1] || null : null;
  const filePath = rawArgs.find((a, i) => !a.startsWith("-") && i !== searchIdx + 1) || null;

  if (isHelp) {
    console.log([
      "Usage: sdd-forge flow get context [path] [--raw] [--search <query>]",
      "",
      "List mode (no path): filtered analysis entries.",
      "File mode (with path): file content + metric increment.",
      "Search mode (--search): keyword search in analysis entries.",
      "",
      "Options:",
      "  --raw              Output content without JSON envelope",
      "  --search <query>   Search entries by keyword (matches against keywords array)",
    ].join("\n"));
    return;
  }

  // File mode
  if (filePath) {
    const absPath = path.resolve(root, filePath);
    if (!fs.existsSync(absPath)) {
      if (isRaw) {
        console.error(`file not found: ${filePath}`);
        process.exitCode = EXIT_ERROR;
        return;
      }
      output(fail("get", "context", "FILE_NOT_FOUND", `file not found: ${filePath}`));
      return;
    }

    // Metric increment
    const state = loadFlowState(root);
    const phase = resolvePhase(state);
    const isDocsPath = filePath.startsWith("docs/") || filePath.startsWith("docs\\");
    incrementMetric(root, phase, isDocsPath ? "docsRead" : "srcRead");

    // Read and return content
    const content = fs.readFileSync(absPath, "utf8");

    if (isRaw) {
      process.stdout.write(content);
      return;
    }

    output(ok("get", "context", {
      path: filePath,
      type: isDocsPath ? "docs" : "src",
      content,
    }));
    return;
  }

  // Search mode
  if (searchQuery) {
    const outputDir = sddOutputDir(root);
    const analysisPath = path.join(outputDir, "analysis.json");

    if (!fs.existsSync(analysisPath)) {
      if (isRaw) {
        console.error("analysis.json not found. Run: sdd-forge docs scan");
        process.exitCode = 1;
        return;
      }
      output(fail("get", "context", "NO_ANALYSIS", "analysis.json not found. Run: sdd-forge docs scan"));
      return;
    }

    let analysis;
    try {
      analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
    } catch (e) {
      output(fail("get", "context", "PARSE_ERROR", `Failed to parse analysis.json: ${e.message}`));
      return;
    }

    const allEntries = [];
    for (const catKey of Object.keys(analysis)) {
      if (ANALYSIS_META_KEYS.has(catKey)) continue;
      const catData = analysis[catKey];
      if (!catData || !Array.isArray(catData.entries)) continue;
      for (const entry of catData.entries) {
        allEntries.push(entry);
      }
    }

    const results = searchEntries(allEntries, searchQuery);

    if (isRaw) {
      for (const r of results) {
        console.log(`${r.file} — ${r.summary || "[no summary]"}`);
        if (r.detail) console.log(r.detail);
        console.log("");
      }
      return;
    }

    output(ok("get", "context", {
      total: results.length,
      entries: results,
    }));
    return;
  }

  // List mode
  const outputDir = sddOutputDir(root);
  const analysisPath = path.join(outputDir, "analysis.json");

  if (!fs.existsSync(analysisPath)) {
    if (isRaw) {
      console.error("analysis.json not found. Run: sdd-forge docs scan");
      process.exitCode = EXIT_ERROR;
      return;
    }
    output(fail("get", "context", "NO_ANALYSIS", "analysis.json not found. Run: sdd-forge docs scan"));
    return;
  }

  let analysis;
  try {
    analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
  } catch (e) {
    output(fail("get", "context", "PARSE_ERROR", `Failed to parse analysis.json: ${e.message}`));
    return;
  }

  const entries = [];
  for (const catKey of Object.keys(analysis)) {
    if (ANALYSIS_META_KEYS.has(catKey)) continue;
    const catData = analysis[catKey];
    if (!catData || !Array.isArray(catData.entries)) continue;
    for (const entry of catData.entries) {
      entries.push(filterEntry(entry));
    }
  }

  // Metric increment for list mode
  const state = loadFlowState(root);
  const phase = resolvePhase(state);
  incrementMetric(root, phase, "docsRead");

  if (isRaw) {
    for (const e of entries) {
      const parts = [e.file];
      if (e.chapter) parts.push(`[${e.chapter}]`);
      if (e.role) parts.push(`(${e.role})`);
      if (e.summary) {
        parts.push("—", e.summary);
      } else {
        parts.push("— [no summary: read source directly]");
      }
      if (e.methods?.length) {
        parts.push(`\n  methods: ${e.methods.join(", ")}`);
      }
      console.log(parts.join(" "));
    }
    return;
  }

  output(ok("get", "context", {
    total: entries.length,
    entries,
  }));
}

export { main, filterEntry, resolvePhase, searchEntries };
runIfDirect(import.meta.url, main);

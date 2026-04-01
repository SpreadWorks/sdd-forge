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
import { sddOutputDir } from "../../lib/config.js";
import { mutateFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import { ANALYSIS_META_KEYS } from "../../docs/lib/analysis-entry.js";
import { EXIT_ERROR } from "../../lib/exit-codes.js";
import { resolveAgent, callAgent } from "../../lib/agent.js";

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

/**
 * Collect all unique keywords from analysis.json entries.
 * @param {Object} analysis - Parsed analysis.json
 * @returns {string[]} Unique keywords array
 */
function collectAllKeywords(analysis) {
  const seen = new Set();
  for (const catKey of Object.keys(analysis)) {
    if (!analysis[catKey] || typeof analysis[catKey] !== "object") continue;
    if (ANALYSIS_META_KEYS.has(catKey)) continue;
    const entries = analysis[catKey].entries;
    if (!Array.isArray(entries)) continue;
    for (const e of entries) {
      if (!Array.isArray(e.keywords)) continue;
      for (const kw of e.keywords) {
        seen.add(String(kw));
      }
    }
  }
  return [...seen];
}

/**
 * Build a prompt for AI keyword selection.
 * @param {string[]} keywords - Available keywords from analysis
 * @param {string} query - User's natural language query
 * @returns {string} Prompt text
 */
function buildKeywordSelectionPrompt(keywords, query) {
  return [
    "You are a keyword selector. Given a query and a list of available keywords, select the keywords that are relevant to the query.",
    "",
    "## Query",
    query,
    "",
    "## Available keywords",
    keywords.join(", "),
    "",
    "## Rules",
    "- Select 5-20 keywords that are most relevant to the query.",
    "- Return ONLY a JSON array of selected keywords. No explanation, no markdown fences.",
    "- Include both direct matches and semantically related keywords.",
    '- Example output: ["auth", "認証", "session", "login"]',
  ].join("\n");
}

/**
 * Fallback search: split query by spaces, OR-match against keywords.
 * @param {Object[]} entries - Analysis entries
 * @param {string} query - Space-separated keywords
 * @returns {Object[]} Matched entries (deduplicated)
 */
function fallbackSearch(entries, query) {
  const terms = query.split(/\s+/).filter(Boolean).map((t) => t.toLowerCase());
  if (terms.length === 0) return [];
  const seen = new Set();
  const results = [];
  for (const e of entries) {
    if (!Array.isArray(e.keywords)) continue;
    const match = terms.some((t) =>
      e.keywords.some((kw) => String(kw).toLowerCase().includes(t))
    );
    if (match && !seen.has(e.file)) {
      seen.add(e.file);
      results.push({
        file: e.file,
        summary: e.summary || null,
        detail: e.detail || null,
        keywords: e.keywords,
        chapter: e.chapter || null,
        role: e.role || null,
      });
    }
  }
  return results;
}

/**
 * AI-powered keyword selection + static match search.
 * Falls back to space-split OR search if agent is unavailable.
 * @param {Object[]} allEntries - All analysis entries
 * @param {Object} analysis - Full analysis object (for keyword collection)
 * @param {string} query - Natural language query
 * @param {string} root - Project root path
 * @returns {Object[]} Matched entries
 */
function aiSearch(allEntries, analysis, query, root) {
  const allKeywords = collectAllKeywords(analysis);
  if (allKeywords.length === 0) return fallbackSearch(allEntries, query);

  let config;
  try { config = loadConfig(root); } catch (_) { config = {}; }
  const agent = resolveAgent(config, "context.search");
  if (!agent) return fallbackSearch(allEntries, query);

  const prompt = buildKeywordSelectionPrompt(allKeywords, query);
  let response;
  try {
    response = callAgent(agent, prompt, 30000, root);
  } catch (_) {
    return fallbackSearch(allEntries, query);
  }

  // Parse AI response as JSON array of keywords
  let selectedKeywords;
  try {
    const cleaned = response.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    selectedKeywords = JSON.parse(cleaned);
    if (!Array.isArray(selectedKeywords)) return fallbackSearch(allEntries, query);
  } catch (_) {
    return fallbackSearch(allEntries, query);
  }

  // Use selected keywords for OR search
  const terms = selectedKeywords.map((k) => String(k).toLowerCase());
  const seen = new Set();
  const results = [];
  for (const e of allEntries) {
    if (!Array.isArray(e.keywords)) continue;
    const match = terms.some((t) =>
      e.keywords.some((kw) => String(kw).toLowerCase().includes(t))
    );
    if (match && !seen.has(e.file)) {
      seen.add(e.file);
      results.push({
        file: e.file,
        summary: e.summary || null,
        detail: e.detail || null,
        keywords: e.keywords,
        chapter: e.chapter || null,
        role: e.role || null,
      });
    }
  }
  return results;
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

export async function execute(ctx) {
  const { root } = ctx;
  const rawArgs = ctx.args;
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
    const state = ctx.flowState;
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

    const results = aiSearch(allEntries, analysis, searchQuery, root);

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
  const state = ctx.flowState;
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

export { filterEntry, resolvePhase, searchEntries };

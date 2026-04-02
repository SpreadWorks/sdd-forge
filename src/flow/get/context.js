#!/usr/bin/env node
/**
 * src/flow/get/context.js
 *
 * flow get context [path] [--raw]
 *
 * List mode (no path): Return filtered analysis entries (file, summary, methods, chapter, role).
 * File mode (with path): Return file content. Metric recording is handled by registry post hook.
 */

import fs from "fs";
import path from "path";
import { sddOutputDir, loadConfig } from "../../lib/config.js";
import { mutateFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import { ANALYSIS_META_KEYS } from "../../docs/lib/analysis-entry.js";
import { EXIT_ERROR } from "../../lib/exit-codes.js";
import { resolveAgent, callAgent } from "../../lib/agent.js";

const EXCLUDE_FIELDS = new Set(["hash", "mtime", "lines", "id", "enrich", "detail"]);

function toSearchResult(e) {
  return {
    file: e.file,
    summary: e.summary || null,
    detail: e.detail || null,
    keywords: e.keywords,
    chapter: e.chapter || null,
    role: e.role || null,
  };
}

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
function collectAllKeywords(analysis, limit = 2000) {
  const freq = new Map();
  for (const catKey of Object.keys(analysis)) {
    if (!analysis[catKey] || typeof analysis[catKey] !== "object") continue;
    if (ANALYSIS_META_KEYS.has(catKey)) continue;
    const entries = analysis[catKey].entries;
    if (!Array.isArray(entries)) continue;
    for (const e of entries) {
      if (!Array.isArray(e.keywords)) continue;
      for (const kw of e.keywords) {
        const s = String(kw);
        freq.set(s, (freq.get(s) || 0) + 1);
      }
    }
  }
  // Sort by frequency descending, then alphabetically for stability
  const sorted = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([kw]) => kw);
  return limit > 0 ? sorted.slice(0, limit) : sorted;
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

const NGRAM_THRESHOLD = 0.15;

/**
 * Split text into bigrams (character pairs).
 * @param {string} text - Input text
 * @returns {string[]} Array of bigrams
 */
function toBigrams(text) {
  const s = text.toLowerCase();
  if (s.length < 2) return [];
  const bigrams = [];
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.push(s.slice(i, i + 2));
  }
  return bigrams;
}

/**
 * Calculate Dice coefficient between two bigram arrays.
 * @param {string[]} a - First bigram set
 * @param {string[]} b - Second bigram set
 * @returns {number} Similarity score between 0 and 1
 */
function bigramSimilarity(a, b) {
  if (a.length === 0 || b.length === 0) return 0.0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const bg of setA) {
    if (setB.has(bg)) intersection++;
  }
  return (2 * intersection) / (setA.size + setB.size);
}

/**
 * N-gram (bigram) based keyword search.
 * Compares query bigrams against entry keywords bigrams using Dice coefficient.
 * @param {Object[]} allEntries - All analysis entries
 * @param {string} query - Natural language query
 * @returns {Object[]} Matched entries sorted by score descending
 */
function ngramSearch(allEntries, query) {
  const queryBigrams = toBigrams(query);
  if (queryBigrams.length === 0) return [];

  const scored = [];
  for (const e of allEntries) {
    if (!Array.isArray(e.keywords) || e.keywords.length === 0) continue;
    // Compute max similarity across all keywords for this entry
    let maxScore = 0;
    for (const kw of e.keywords) {
      const kwBigrams = toBigrams(String(kw));
      const score = bigramSimilarity(queryBigrams, kwBigrams);
      if (score > maxScore) maxScore = score;
    }
    if (maxScore >= NGRAM_THRESHOLD) {
      scored.push({ entry: e, score: maxScore });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.map(({ entry }) => toSearchResult(entry));
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
  if (selectedKeywords.length === 0) return fallbackSearch(allEntries, query);

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
  // If AI-selected keywords matched nothing, fall back to text search
  if (results.length === 0) return fallbackSearch(allEntries, query);
  return results;
}

/**
 * Dispatch search based on configured mode with fallback chain.
 * - ngram mode: ngramSearch → fallbackSearch → aiSearch
 * - ai mode: aiSearch → fallbackSearch (legacy behavior)
 * @param {Object[]} allEntries - All analysis entries
 * @param {Object} analysis - Full analysis object
 * @param {string} query - Search query
 * @param {string} root - Project root path
 * @param {string} mode - Search mode ("ngram" or "ai")
 * @returns {Object[]} Matched entries
 */
function contextSearch(allEntries, analysis, query, root, mode = "ngram") {
  if (mode === "ai") {
    return aiSearch(allEntries, analysis, query, root);
  }

  // ngram mode (default): ngram → fallbackSearch → AI
  let results = ngramSearch(allEntries, query);
  if (results.length > 0) return results;

  results = fallbackSearch(allEntries, query);
  if (results.length > 0) return results;

  // Final fallback: try AI if agent is available
  return aiSearch(allEntries, analysis, query, root);
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

    // Metric recording is handled by the registry post hook (see registry.js)
    const isDocsPath = filePath.startsWith("docs/") || filePath.startsWith("docs\\");

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

    let config;
    try { config = loadConfig(root); } catch (_e) { config = {}; }
    const searchMode = config?.flow?.commands?.context?.search?.mode ?? "ngram";
    const results = contextSearch(allEntries, analysis, searchQuery, root, searchMode);

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

  // Metric recording is handled by the registry post hook (see registry.js)

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

export { filterEntry, resolvePhase, searchEntries, collectAllKeywords, buildKeywordSelectionPrompt, fallbackSearch, toBigrams, bigramSimilarity, ngramSearch };

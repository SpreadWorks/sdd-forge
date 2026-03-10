#!/usr/bin/env node
/**
 * sdd-forge/docs/commands/enrich.js
 *
 * AI で analysis.json の各エントリーに summary/detail/chapter/role を付与する。
 * scan 後に実行し、enriched analysis.json を生成する。
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadLang, sddOutputDir } from "../../lib/config.js";
import { resolveAgent, callAgentAsync, LONG_AGENT_TIMEOUT_MS, resolveWorkDir, writeAgentContext, cleanupAgentContext } from "../../lib/agent.js";
import { resolveCommandContext, loadFullAnalysis } from "../lib/command-context.js";
import { resolveChaptersOrder } from "../lib/template-merger.js";
import { createLogger } from "../../lib/progress.js";
import { createI18n } from "../../lib/i18n.js";

const logger = createLogger("enrich");

const META_KEYS = new Set(["analyzedAt", "enrichedAt", "generatedAt", "extras", "files", "root"]);

function printHelp(t) {
  const h = t.raw("help.cmdHelp.enrich");
  const opts = h.options;
  console.log(
    [
      h.usage,
      "",
      h.desc,
      "",
      "Options:",
      `  ${opts.agent}`,
      `  ${opts.dryRun}`,
      `  ${opts.stdout}`,
      `  ${opts.help}`,
    ].join("\n"),
  );
}

/**
 * Collect source code content for each entry in a category.
 *
 * @param {Object[]} items - Category items with file/name properties
 * @param {string} srcRoot - Source root directory
 * @returns {Object[]} Items augmented with sourceCode
 */
function collectSourceCode(items, srcRoot) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    const filePath = item.file || item.name;
    if (!filePath) return item;
    const absPath = path.resolve(srcRoot, filePath);
    try {
      const code = fs.readFileSync(absPath, "utf8");
      // Truncate very large files to avoid context overflow
      const MAX_CHARS = 8000;
      const sourceCode = code.length > MAX_CHARS
        ? code.slice(0, MAX_CHARS) + "\n... (truncated)"
        : code;
      return { ...item, sourceCode };
    } catch (_) {
      return item;
    }
  });
}

/**
 * Build the context data (source code entries) for the enrich prompt.
 * This is the large part that goes into a context file.
 *
 * @param {Object} analysis - Raw analysis data
 * @param {string} srcRoot - Source root directory
 * @returns {string} Context text with source code entries
 */
function buildEnrichContext(analysis, srcRoot) {
  const parts = [];

  parts.push("# Source code entries by category");
  parts.push("");

  const categories = Object.keys(analysis).filter((k) => !META_KEYS.has(k));

  for (const cat of categories) {
    const data = analysis[cat];
    const items = data[cat] || [];
    if (items.length === 0) continue;

    const enrichedItems = collectSourceCode(items, srcRoot);

    parts.push(`## Category: ${cat} (${items.length} entries)`);
    for (const item of enrichedItems) {
      parts.push(`\n### ${item.file || item.name || item.className || "unknown"}`);
      if (item.className) parts.push(`Class: ${item.className}`);
      if (item.methods?.length) parts.push(`Methods: ${item.methods.map((m) => m.name || m).join(", ")}`);
      if (item.sourceCode) {
        parts.push("```");
        parts.push(item.sourceCode);
        parts.push("```");
      }
    }
    parts.push("");
  }

  return parts.join("\n");
}

/**
 * Build the instruction prompt for the AI to enrich analysis entries.
 * This is the small part that goes as the CLI argument.
 *
 * @param {string[]} chapters - Chapter file names from preset
 * @returns {string} Prompt text (instructions + output format)
 */
function buildEnrichPrompt(chapters) {
  const parts = [];

  parts.push("You are analyzing a software project to generate documentation metadata.");
  parts.push("The source code entries are provided in context files (.claude/rules/).");
  parts.push("For each source code entry, provide structured information in JSON format.");
  parts.push("");

  // Chapter list
  parts.push("## Available chapters");
  parts.push("Each entry should be assigned to one of these chapters:");
  for (const ch of chapters) {
    parts.push(`- ${ch.replace(/\.md$/, "")}`);
  }
  parts.push("");

  // Output format instruction
  parts.push("## Output format");
  parts.push("");
  parts.push("Return a JSON object with the following structure:");
  parts.push("```json");
  parts.push('{');
  parts.push('  "<category>": [');
  parts.push('    {');
  parts.push('      "index": 0,');
  parts.push('      "summary": "1-2 sentence summary of what this file/class does",');
  parts.push('      "detail": "Detailed description of the implementation, key logic, patterns used. Do not omit information.",');
  parts.push('      "chapter": "chapter_name (from the available chapters list, without .md)",');
  parts.push('      "role": "one of: controller, model, lib, config, cli, middleware, test, migration, route, view, other"');
  parts.push('    }');
  parts.push('  ]');
  parts.push('}');
  parts.push("```");
  parts.push("");
  parts.push("Rules:");
  parts.push("- Return ONLY valid JSON, no markdown fences, no explanation text.");
  parts.push("- One entry per item in the same order as provided.");
  parts.push("- The `index` field must match the position (0-based) in the original array.");
  parts.push("- `summary` should be concise (1-2 sentences).");
  parts.push("- `detail` should capture implementation details from the source code. Do not truncate or summarize away important information.");
  parts.push("- `chapter` must be one of the available chapter names (without .md extension).");
  parts.push("- Write in the project's primary language (match the existing analysis data language).");

  return parts.join("\n");
}

/**
 * Parse the AI response and extract enrichment data.
 *
 * @param {string} response - Raw AI response
 * @returns {Object|null} Parsed enrichment data
 */
function parseEnrichResponse(response) {
  // Strip markdown fences if present
  let cleaned = response.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Try to find JSON object in the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (__) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Merge enrichment data into the analysis object.
 *
 * @param {Object} analysis - Original analysis data
 * @param {Object} enrichment - AI-generated enrichment data
 * @returns {Object} Enriched analysis
 */
function mergeEnrichment(analysis, enrichment) {
  const result = { ...analysis };

  for (const cat of Object.keys(enrichment)) {
    if (!result[cat]) continue;
    const items = result[cat][cat];
    if (!Array.isArray(items)) continue;

    const enrichedItems = enrichment[cat];
    if (!Array.isArray(enrichedItems)) continue;

    for (const entry of enrichedItems) {
      const idx = entry.index;
      if (idx == null || idx < 0 || idx >= items.length) continue;

      items[idx] = {
        ...items[idx],
        summary: entry.summary || items[idx].summary,
        detail: entry.detail || items[idx].detail,
        chapter: entry.chapter || items[idx].chapter,
        role: entry.role || items[idx].role,
      };
    }
  }

  result.enrichedAt = new Date().toISOString();
  return result;
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function main(ctx) {
  if (!ctx) {
    const cli = parseArgs(process.argv.slice(2), {
      flags: ["--stdout", "--dry-run"],
      options: { "--agent": "agent" },
      defaults: { stdout: false, dryRun: false },
    });
    if (cli.help) {
      const root = repoRoot(import.meta.url);
      printHelp(createI18n(loadLang(root), { domain: "ui" }));
      return;
    }
    ctx = resolveCommandContext(cli);
    ctx.dryRun = cli.dryRun;
    ctx.stdout = cli.stdout;
    ctx.agentName = cli.agent;
  }

  const { root, srcRoot, config, type } = ctx;
  const agentName = ctx.agentName || config.defaultAgent;

  // Load analysis
  const analysis = loadFullAnalysis(root);
  if (!analysis) {
    throw new Error("enrich: analysis.json not found. Run 'sdd-forge scan' first.");
  }

  // Check for AI agent
  const agent = resolveAgent(config, agentName);
  if (!agent) {
    logger.log("WARN: no agent configured, skipping enrich.");
    logger.log("Set 'defaultAgent' in config.json or use: sdd-forge enrich --agent <name>");
    return;
  }

  // Get chapter list from preset
  const chapters = resolveChaptersOrder(type);
  if (chapters.length === 0) {
    logger.log("WARN: no chapters defined in preset, skipping enrich.");
    return;
  }

  logger.log("enriching analysis with AI...");

  // Build prompt: instructions (small CLI arg) + context (large file)
  const prompt = buildEnrichPrompt(chapters);
  const contextData = buildEnrichContext(analysis, srcRoot);

  // Write context to work dir so Claude CLI reads it automatically
  const workDir = resolveWorkDir(root, config);
  const ctxFile = writeAgentContext(workDir, contextData);

  // Call AI with cwd = workDir
  const timeoutMs = Number(config.limits?.designTimeoutMs || 0) || LONG_AGENT_TIMEOUT_MS;
  let response;
  try {
    response = await callAgentAsync(agent, prompt, timeoutMs, workDir);
  } catch (err) {
    cleanupAgentContext(ctxFile);
    throw new Error(`enrich: AI agent failed: ${err.message}`);
  }
  cleanupAgentContext(ctxFile);

  if (!response) {
    throw new Error("enrich: AI agent returned empty response.");
  }

  // Parse response
  const enrichment = parseEnrichResponse(response);
  if (!enrichment) {
    logger.log("WARN: failed to parse AI response as JSON.");
    if (ctx.stdout) process.stdout.write(response + "\n");
    throw new Error("enrich: could not parse AI response. Raw output may be available with --stdout.");
  }

  // Merge
  const enriched = mergeEnrichment(analysis, enrichment);

  // Count enriched entries
  const categories = Object.keys(enrichment);
  const totalEntries = categories.reduce((sum, cat) => {
    return sum + (Array.isArray(enrichment[cat]) ? enrichment[cat].length : 0);
  }, 0);
  logger.log(`enriched ${totalEntries} entries across ${categories.length} categories`);

  // Output
  const json = JSON.stringify(enriched);

  if (ctx.stdout || ctx.dryRun) {
    process.stdout.write(json + "\n");
  } else {
    const outputDir = sddOutputDir(root);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, "analysis.json");
    fs.writeFileSync(outputPath, json + "\n");
    logger.log(`output: ${path.relative(root, outputPath)}`);
  }
}

export { main, buildEnrichPrompt, buildEnrichContext, parseEnrichResponse, mergeEnrichment };

runIfDirect(import.meta.url, main);

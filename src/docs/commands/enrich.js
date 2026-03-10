#!/usr/bin/env node
/**
 * sdd-forge/docs/commands/enrich.js
 *
 * AI で analysis.json の各エントリーに summary/detail/chapter/role を付与する。
 * scan 後に実行し、enriched analysis.json を生成する。
 *
 * バッチ処理: エントリーを固定サイズのバッチに分割して AI を呼び出す。
 * レジューム: 各バッチ完了後に analysis.json を保存。既に enriched なエントリーはスキップ。
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadLang, sddOutputDir } from "../../lib/config.js";
import { resolveAgent, callAgentAsync, LONG_AGENT_TIMEOUT_MS } from "../../lib/agent.js";
import { resolveCommandContext, loadFullAnalysis } from "../lib/command-context.js";
import { resolveChaptersOrder } from "../lib/template-merger.js";
import { createLogger } from "../../lib/progress.js";
import { createI18n } from "../../lib/i18n.js";

const logger = createLogger("enrich");

const META_KEYS = new Set(["analyzedAt", "enrichedAt", "generatedAt", "extras", "files", "root"]);
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_BATCH_LINES = 3000;

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
 * analysis からカテゴリ横断でフラットなエントリーリストを収集する。
 * 各エントリーには category と index を付与。
 *
 * @param {Object} analysis - analysis.json のデータ
 * @returns {Array<{category: string, index: number, file: string, lines: number, enriched: boolean}>}
 */
function collectEntries(analysis) {
  const entries = [];
  for (const cat of Object.keys(analysis)) {
    if (META_KEYS.has(cat)) continue;
    const items = analysis[cat]?.[cat];
    if (!Array.isArray(items)) continue;
    for (let i = 0; i < items.length; i++) {
      entries.push({
        category: cat,
        index: i,
        file: items[i].file || items[i].name || `${cat}[${i}]`,
        lines: items[i].lines || 0,
        enriched: !!items[i].summary,
      });
    }
  }
  return entries;
}

/**
 * エントリーを合計行数ベースでバッチに分割する。
 * 1バッチあたりの合計行数が maxLines を超えないようにする。
 * ただし1エントリーが maxLines を超える場合はそのエントリー単独で1バッチ。
 *
 * @param {Array} entries - collectEntries の結果
 * @param {number} maxLines - 1バッチあたりの最大合計行数
 * @param {number} maxItems - 1バッチあたりの最大件数（フォールバック）
 * @returns {Array<Array>} バッチの配列
 */
function splitIntoBatches(entries, maxLines, maxItems) {
  if (maxLines <= 0) {
    // 行数情報がない場合は件数ベースでフォールバック
    const batches = [];
    for (let i = 0; i < entries.length; i += maxItems) {
      batches.push(entries.slice(i, i + maxItems));
    }
    return batches;
  }

  const batches = [];
  let current = [];
  let currentLines = 0;

  for (const entry of entries) {
    // 現バッチに追加すると超過する場合、新バッチを開始
    if (current.length > 0 && (currentLines + entry.lines > maxLines || current.length >= maxItems)) {
      batches.push(current);
      current = [];
      currentLines = 0;
    }
    current.push(entry);
    currentLines += entry.lines;
  }
  if (current.length > 0) {
    batches.push(current);
  }
  return batches;
}

/**
 * バッチ用の enrich プロンプトを生成する。
 * 対象ファイルの一覧を明示し、AI にそれぞれのソースを読ませる。
 *
 * @param {string[]} chapters - Chapter file names from preset
 * @param {Array<{category: string, index: number, file: string}>} batchEntries - バッチ内のエントリー
 * @returns {string} Prompt text
 */
function buildEnrichPrompt(chapters, batchEntries) {
  const parts = [];

  parts.push("Read each of the following source files and add structured metadata.");
  parts.push("");

  // File list
  parts.push("## Target files");
  parts.push("");
  for (const entry of batchEntries) {
    parts.push(`- category: "${entry.category}", index: ${entry.index}, file: "${entry.file}"`);
  }
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
  parts.push("- Group entries by category in the output.");
  parts.push("- The `index` field must match the original index provided above.");
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
 * Merge enrichment data into the analysis object (mutates analysis).
 *
 * @param {Object} analysis - Original analysis data
 * @param {Object} enrichment - AI-generated enrichment data
 * @returns {Object} Enriched analysis (same reference)
 */
function mergeEnrichment(analysis, enrichment) {
  for (const cat of Object.keys(enrichment)) {
    if (!analysis[cat]) continue;
    const items = analysis[cat][cat];
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

  analysis.enrichedAt = new Date().toISOString();
  return analysis;
}

/**
 * analysis.json をディスクに保存する。
 */
function saveAnalysis(root, analysis) {
  const outputDir = sddOutputDir(root);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, "analysis.json");
  fs.writeFileSync(outputPath, JSON.stringify(analysis) + "\n");
  return outputPath;
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

  // Collect entries and filter out already-enriched ones (resume)
  const allEntries = collectEntries(analysis);
  const pending = allEntries.filter((e) => !e.enriched);

  if (pending.length === 0) {
    logger.log("all entries already enriched, skipping.");
    return;
  }

  const skipped = allEntries.length - pending.length;
  if (skipped > 0) {
    logger.log(`resuming: ${skipped} already enriched, ${pending.length} remaining`);
  } else {
    logger.log(`enriching ${pending.length} entries with AI...`);
  }

  // Split into batches (lines-based with item count fallback)
  const maxItems = Number(config.limits?.enrichBatchSize || 0) || DEFAULT_BATCH_SIZE;
  const maxLines = Number(config.limits?.enrichBatchLines || 0) || DEFAULT_BATCH_LINES;
  const hasLines = pending.some((e) => e.lines > 0);
  const batches = splitIntoBatches(pending, hasLines ? maxLines : 0, maxItems);

  const timeoutMs = Number(config.limits?.designTimeoutMs || 0) || LONG_AGENT_TIMEOUT_MS;
  let totalEnriched = 0;

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    logger.log(`batch ${b + 1}/${batches.length} (${batch.length} entries)`);

    const prompt = buildEnrichPrompt(chapters, batch);

    let response;
    try {
      response = await callAgentAsync(agent, prompt, timeoutMs, root);
    } catch (err) {
      // Save progress before failing
      if (totalEnriched > 0 && !ctx.dryRun && !ctx.stdout) {
        const saved = saveAnalysis(root, analysis);
        logger.log(`saved progress (${totalEnriched} entries) to ${path.relative(root, saved)}`);
      }
      throw new Error(`enrich: AI agent failed at batch ${b + 1}/${batches.length}: ${err.message}`);
    }

    if (!response) {
      if (totalEnriched > 0 && !ctx.dryRun && !ctx.stdout) {
        const saved = saveAnalysis(root, analysis);
        logger.log(`saved progress (${totalEnriched} entries) to ${path.relative(root, saved)}`);
      }
      throw new Error(`enrich: AI agent returned empty response at batch ${b + 1}/${batches.length}.`);
    }

    const enrichment = parseEnrichResponse(response);
    if (!enrichment) {
      if (totalEnriched > 0 && !ctx.dryRun && !ctx.stdout) {
        const saved = saveAnalysis(root, analysis);
        logger.log(`saved progress (${totalEnriched} entries) to ${path.relative(root, saved)}`);
      }
      throw new Error(`enrich: could not parse AI response at batch ${b + 1}/${batches.length}.`);
    }

    // Merge batch results into analysis (mutates)
    mergeEnrichment(analysis, enrichment);

    const batchCount = Object.values(enrichment).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0,
    );
    totalEnriched += batchCount;

    // Save after each batch (resume point)
    if (!ctx.dryRun && !ctx.stdout) {
      saveAnalysis(root, analysis);
    }
  }

  logger.log(`enriched ${totalEnriched} entries in ${batches.length} batches`);

  // Final output
  if (ctx.stdout || ctx.dryRun) {
    process.stdout.write(JSON.stringify(analysis) + "\n");
  } else {
    const outputPath = saveAnalysis(root, analysis);
    logger.log(`output: ${path.relative(root, outputPath)}`);
  }
}

export { main, buildEnrichPrompt, parseEnrichResponse, mergeEnrichment, collectEntries, splitIntoBatches, DEFAULT_BATCH_SIZE, DEFAULT_BATCH_LINES };

runIfDirect(import.meta.url, main);

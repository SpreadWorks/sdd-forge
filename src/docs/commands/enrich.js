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
import { parseArgs } from "../../lib/cli.js";
import { sddOutputDir } from "../../lib/config.js";
import { resolveAgent, callAgentAsync, DEFAULT_AGENT_TIMEOUT } from "../../lib/agent.js";
import { resolveCommandContext, loadFullAnalysis } from "../lib/command-context.js";
import { resolveChaptersOrder } from "../lib/template-merger.js";
import { createLogger } from "../../lib/progress.js";
import { translate } from "../../lib/i18n.js";

const logger = createLogger("enrich");

const META_KEYS = new Set(["analyzedAt", "enrichedAt", "generatedAt", "files", "root"]);
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_BATCH_LINES = 3000;

function printHelp() {
  const t = translate();
  const h = t.raw("ui:help.cmdHelp.enrich");
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
    const catData = analysis[cat];
    if (!catData || typeof catData !== "object") continue;
    for (const subKey of Object.keys(catData)) {
      const items = catData[subKey];
      if (!Array.isArray(items)) continue;
      for (let i = 0; i < items.length; i++) {
        entries.push({
          category: cat,
          subKey,
          index: i,
          file: items[i].file || items[i].name || `${cat}.${subKey}[${i}]`,
          lines: items[i].lines || 0,
          enriched: !!items[i].summary,
        });
      }
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
    parts.push(`- category: "${entry.category}", subKey: "${entry.subKey}", index: ${entry.index}, file: "${entry.file}"`);
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
  parts.push('  "<category>": {');
  parts.push('    "<subKey>": [');
  parts.push('      {');
  parts.push('        "index": 0,');
  parts.push('        "summary": "1-2 sentence summary of what this file/class does",');
  parts.push('        "detail": "Detailed description of the implementation, key logic, patterns used. Do not omit information.",');
  parts.push('        "chapter": "chapter_name (from the available chapters list, without .md)",');
  parts.push('        "role": "one of: controller, model, lib, config, cli, middleware, test, migration, route, view, other"');
  parts.push('      }');
  parts.push('    ]');
  parts.push('  }');
  parts.push('}');
  parts.push("```");
  parts.push("");
  parts.push("Rules:");
  parts.push("- Return ONLY valid JSON, no markdown fences, no explanation text.");
  parts.push("- Group entries by category and subKey in the output.");
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
        // Try to fix unescaped quotes inside string values.
        // AI often outputs unescaped " inside detail/summary fields.
        const fixed = fixUnescapedQuotes(match[0]);
        try {
          return JSON.parse(fixed);
        } catch (___) {
          return null;
        }
      }
    }
    return null;
  }
}

/**
 * JSON 文字列値内のエスケープされていないダブルクォーテーションを修復する。
 * AI が detail/summary に this.desc("foo", bar) のような未エスケープ引用符を含めるケース対策。
 *
 * 戦略: 行単位で解析し、JSON の構造キー（"key": "value"）の value 部分内にある
 * 未エスケープクォートを \\" に置換する。
 */
function fixUnescapedQuotes(json) {
  const lines = json.split("\n");
  const result = [];

  for (const line of lines) {
    // Match lines like:  "key": "value",
    // Capture the value portion and fix unescaped quotes within it
    const m = line.match(/^(\s*"(?:summary|detail)"\s*:\s*")(.*)(",?\s*)$/);
    if (m) {
      const [, prefix, value, suffix] = m;
      // Escape unescaped double quotes in the value
      // First un-escape already escaped ones to avoid double-escaping, then re-escape all
      const fixed = value
        .replace(/\\"/g, "\x00")      // temp-mark already-escaped quotes
        .replace(/"/g, '\\"')          // escape all remaining quotes
        .replace(/\x00/g, '\\"');      // restore temp-marked ones
      result.push(prefix + fixed + suffix);
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
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
    const catEnrichment = enrichment[cat];
    if (!catEnrichment || typeof catEnrichment !== "object") continue;

    // Support both new format { subKey: [...] } and legacy format [...]
    const subKeys = Array.isArray(catEnrichment)
      ? { [cat]: catEnrichment }
      : catEnrichment;

    for (const subKey of Object.keys(subKeys)) {
      const items = analysis[cat][subKey];
      if (!Array.isArray(items)) continue;

      const enrichedItems = subKeys[subKey];
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
      defaults: { stdout: false, dryRun: false },
    });
    if (cli.help) {
      printHelp();
      return;
    }
    ctx = resolveCommandContext(cli, { commandId: "docs.enrich" });
    ctx.dryRun = cli.dryRun;
    ctx.stdout = cli.stdout;
  }

  const { root, srcRoot, config, type } = ctx;

  // Load analysis
  const analysis = loadFullAnalysis(root);
  if (!analysis) {
    throw new Error("enrich: analysis.json not found. Run 'sdd-forge scan' first.");
  }

  // Check for AI agent
  const agent = resolveAgent(config, ctx.commandId || "docs.enrich");
  if (!agent) {
    logger.log("WARN: no agent configured, skipping enrich.");
    logger.log("Set 'defaultAgent' in config.json.");
    return;
  }

  // Get chapter list from preset (config.chapters overrides preset)
  const configChapters = config?.chapters;
  const chapters = resolveChaptersOrder(type, configChapters);
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
  const maxItems = Number(config.docs?.enrichBatchSize || 0) || DEFAULT_BATCH_SIZE;
  const maxLines = Number(config.docs?.enrichBatchLines || 0) || DEFAULT_BATCH_LINES;
  const hasLines = pending.some((e) => e.lines > 0);
  const batches = splitIntoBatches(pending, hasLines ? maxLines : 0, maxItems);

  const timeoutMs = config.agent?.timeout ? Number(config.agent.timeout) * 1000 : DEFAULT_AGENT_TIMEOUT * 1000;
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
      // Dump failed response for debugging
      const dumpPath = path.join(sddOutputDir(root), `enrich-fail-batch${b + 1}.txt`);
      try { fs.writeFileSync(dumpPath, response); } catch (_) { /* ignore */ }
      logger.log(`response preview (${response.length} chars): ${response.slice(0, 200)}...`);
      logger.log(`full response dumped to: ${path.relative(root, dumpPath)}`);
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

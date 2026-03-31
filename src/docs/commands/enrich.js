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
import { resolveAgent, callAgentAsync, DEFAULT_AGENT_TIMEOUT, resolveWorkDir } from "../../lib/agent.js";
import { resolveCommandContext, loadFullAnalysis } from "../lib/command-context.js";
import { resolveChaptersOrder } from "../lib/template-merger.js";
import { buildCategoryMapFromDocs, mergeChapters } from "../lib/chapter-resolver.js";
import { globToRegex } from "../lib/scanner.js";
import { createLogger } from "../../lib/progress.js";
import { translate } from "../../lib/i18n.js";
import { extractBalancedJson, fixUnescapedQuotes } from "../../lib/json-parse.js";
import { ANALYSIS_META_KEYS } from "../lib/analysis-entry.js";

const logger = createLogger("enrich");
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
    if (ANALYSIS_META_KEYS.has(cat)) continue;
    const catData = analysis[cat];
    if (!catData || typeof catData !== "object") continue;
    const items = catData.entries;
    if (!Array.isArray(items)) continue;
    for (let i = 0; i < items.length; i++) {
      entries.push({
        category: cat,
        index: i,
        file: items[i].file || items[i].name || `${cat}.entries[${i}]`,
        lines: items[i].lines || 0,
        enriched: !!items[i].enrich?.processedAt,
      });
    }
  }
  return entries;
}

/**
 * docs.exclude パターンでエントリをフィルタする。
 * マッチしたエントリを除外し、残りを返す。
 *
 * @param {Array} entries - collectEntries() の結果
 * @param {string[]|undefined} excludePatterns - glob パターン配列
 * @returns {Array} フィルタ済みエントリ
 */
function filterByDocsExclude(entries, excludePatterns) {
  if (!excludePatterns?.length) return entries;
  const regexes = excludePatterns.map((p) => globToRegex(p));
  return entries.filter((e) => {
    if (!e.file) return true;
    return !regexes.some((re) => re.test(e.file));
  });
}

function entryKey(category, index) {
  return `${category}:${index}`;
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
function buildEnrichPrompt(chapters, batchEntries, opts) {
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

  // Chapter list (accepts both string[] and {chapter, desc}[])
  parts.push("## Available chapters");
  parts.push("Each entry should be assigned to one of these chapters:");
  for (const ch of chapters) {
    if (typeof ch === "string") {
      parts.push(`- ${ch.replace(/\.md$/, "")}`);
    } else {
      const name = ch.chapter.replace(/\.md$/, "");
      parts.push(ch.desc ? `- ${name}: ${ch.desc}` : `- ${name}`);
    }
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
  // Monorepo app assignment (optional)
  const monorepoApps = opts?.monorepoApps;
  if (Array.isArray(monorepoApps) && monorepoApps.length > 0) {
    parts.push("## Monorepo apps");
    parts.push("This is a monorepo. Assign each entry to one of these apps based on its file path:");
    for (const app of monorepoApps) {
      parts.push(`- "${app.name}" (path prefix: ${app.path})`);
    }
    parts.push('Add an `"app"` field to each entry with the app name.');
    parts.push("");
  }

  parts.push("Rules:");
  parts.push("- Return ONLY valid JSON, no markdown fences, no explanation text.");
  parts.push("- Group entries by category in the output.");
  parts.push("- The `index` field must match the original index provided above.");
  parts.push("- `summary` should be concise (1-2 sentences).");
  parts.push("- `detail` should capture implementation details from the source code. Do not truncate or summarize away important information.");
  parts.push("- `chapter` must be one of the available chapter names (without .md extension).");
  if (monorepoApps) {
    parts.push("- `app` must be one of the monorepo app names listed above (omit if file does not belong to any app).");
  }
  const LANG_NAMES = { en: "English", ja: "Japanese", zh: "Chinese", ko: "Korean", fr: "French", de: "German", es: "Spanish", pt: "Portuguese", it: "Italian", ru: "Russian" };
  const lang = opts?.lang || "en";
  const langName = LANG_NAMES[lang] || lang;
  parts.push(`- Write ALL output text (summary, detail, and any descriptive content) strictly in ${langName}. Even if the source code contains comments or strings in other languages, translate them into ${langName} in your output.`);

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
    // Extract JSON by bracket balancing (greedy regex can overshoot with nested braces)
    const extracted = extractBalancedJson(cleaned);
    if (extracted) {
      try {
        return JSON.parse(extracted);
      } catch (__) {
        const fixed = fixUnescapedQuotes(extracted);
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
 * Merge enrichment data into the analysis object (mutates analysis).
 *
 * @param {Object} analysis - Original analysis data
 * @param {Object} enrichment - AI-generated enrichment data
 * @param {Object} [opts] - Merge options
 * @returns {Object} Enriched analysis (same reference)
 */
function mergeEnrichment(analysis, enrichment, opts = {}) {
  const processedAt = opts.now || new Date().toISOString();
  const attemptsByKey = opts.attemptsByKey || new Map();
  const onWarn = opts.onWarn || (() => {});
  const respondedKeys = new Set();

  for (const cat of Object.keys(enrichment)) {
    if (!analysis[cat]) continue;
    const enrichedItems = enrichment[cat];
    if (!Array.isArray(enrichedItems)) continue;

    const items = analysis[cat].entries;
    if (!Array.isArray(items)) continue;

    for (const entry of enrichedItems) {
      if (!entry || typeof entry !== "object") continue;
      const idx = entry.index;
      if (idx == null || idx < 0 || idx >= items.length) continue;
      respondedKeys.add(entryKey(cat, idx));

      // Validate chapter if validChapters set is provided
      let chapter = entry.chapter || items[idx].chapter;
      const validChapters = opts.validChapters;
      if (chapter && validChapters && !validChapters.has(chapter)) {
        onWarn(`WARN: invalid chapter "${chapter}" for ${cat}[${idx}], skipped`);
        chapter = items[idx].chapter || null;
      }

      items[idx] = {
        ...items[idx],
        summary: entry.summary || items[idx].summary,
        detail: entry.detail || items[idx].detail,
        chapter,
        role: entry.role || items[idx].role,
        enrich: {
          processedAt,
          attempts: attemptsByKey.get(entryKey(cat, idx)) ?? items[idx].enrich?.attempts ?? 1,
        },
        ...(entry.app ? { app: entry.app } : {}),
      };

      if (!entry.summary) {
        const file = items[idx].file || items[idx].name || `${cat}.entries[${idx}]`;
        onWarn(`WARN: summary missing for ${file} (category=${cat}, index=${idx})`);
      }
    }
  }

  for (const [key, attempts] of attemptsByKey.entries()) {
    if (respondedKeys.has(key)) continue;
    const [category, rawIndex] = key.split(":");
    const index = Number(rawIndex);
    const item = analysis?.[category]?.entries?.[index];
    if (!item) continue;
    item.enrich = {
      ...item.enrich,
      attempts,
    };
  }

  analysis.enrichedAt = processedAt;
  return analysis;
}

function buildAttemptsByKey(analysis, batchEntries, attemptsUsed) {
  const attempts = new Map();
  for (const entry of batchEntries) {
    const current = analysis?.[entry.category]?.entries?.[entry.index]?.enrich?.attempts ?? 0;
    attempts.set(entryKey(entry.category, entry.index), current + attemptsUsed);
  }
  return attempts;
}

function saveProgress(root, analysis, totalEnriched, ctx) {
  if (totalEnriched > 0 && !ctx.dryRun && !ctx.stdout) {
    const saved = saveAnalysis(root, analysis);
    logger.log(`saved progress (${totalEnriched} entries) to ${path.relative(root, saved)}`);
  }
}

function formatBatchError(err, b, batches) {
  if (err?.message === "empty response") {
    return `enrich: AI agent returned empty response at batch ${b + 1}/${batches.length}.`;
  }
  return `enrich: AI agent failed at batch ${b + 1}/${batches.length}: ${err.message}`;
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
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2) + "\n");
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

  // Get chapter list from preset
  const presetChapterNames = resolveChaptersOrder(type, undefined);
  if (presetChapterNames.length === 0) {
    logger.log("WARN: no chapters defined in preset, skipping enrich.");
    return;
  }

  // Build chapter objects with desc (preset defaults + config overrides)
  const presetChapters = presetChapterNames.map((name) => {
    // resolveChaptersOrder returns string[] from preset.json
    // If preset.json has been migrated to object format, the name is already extracted
    return typeof name === "string" ? { chapter: name } : name;
  });
  const chapters = mergeChapters(presetChapters, config?.chapters);

  // Static chapter assignment from {{data}} categories (R4)
  const { docsDir } = ctx;
  const chapterFileNames = chapters.map((c) => c.chapter);
  const categoryToChapter = buildCategoryMapFromDocs(docsDir, chapterFileNames);
  if (categoryToChapter.size > 0) {
    logger.log(`static chapter mapping: ${categoryToChapter.size} categories from {{data}} directives`);
  }

  // Collect entries and filter out already-enriched ones (resume)
  const allEntries = collectEntries(analysis);

  // Apply static chapter assignment to pending entries
  for (const entry of allEntries) {
    if (entry.enriched) continue;
    const staticChapter = categoryToChapter.get(entry.category);
    if (staticChapter) {
      // Set chapter statically; AI will still generate summary/detail
      const items = analysis[entry.category]?.entries;
      if (items && items[entry.index]) {
        items[entry.index].chapter = staticChapter;
      }
    }
  }

  // Filter by docs.exclude patterns
  const docsExclude = config?.docs?.exclude;
  const filtered = filterByDocsExclude(allEntries, docsExclude);
  const excludedCount = allEntries.length - filtered.length;
  if (excludedCount > 0) {
    logger.log(`excluded ${excludedCount} entries by docs.exclude`);
  }

  const pending = filtered.filter((e) => !e.enriched);

  if (pending.length === 0) {
    logger.log("all entries already enriched, skipping.");
    return;
  }

  const skipped = filtered.length - pending.length;
  if (skipped > 0) {
    logger.log(`resuming: ${skipped} already enriched, ${pending.length} remaining`);
  } else {
    logger.log(`enriching ${pending.length} entries with AI...`);
  }

  // Split into batches (lines-based with item count fallback)
  const maxItems = Number(config.docs?.enrichBatchSize || 0) || DEFAULT_BATCH_SIZE;
  const maxLines = Number(config.docs?.enrichBatchLines || 0) || DEFAULT_BATCH_LINES;
  const retryCount = Number(config?.agent?.retryCount) || 0;
  const hasLines = pending.some((e) => e.lines > 0);
  const batches = splitIntoBatches(pending, hasLines ? maxLines : 0, maxItems);

  const timeoutMs = config.agent?.timeout ? Number(config.agent.timeout) * 1000 : DEFAULT_AGENT_TIMEOUT * 1000;
  let totalEnriched = 0;

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    logger.log(`batch ${b + 1}/${batches.length} (${batch.length} entries)`);

    const prompt = buildEnrichPrompt(chapters, batch, { monorepoApps: config.monorepo?.apps, lang: config.docs?.defaultLanguage || "en" });

    let response;
    try {
      response = await callAgentAsync(agent, prompt, timeoutMs, root, {
        retryCount,
      });
    } catch (err) {
      saveProgress(root, analysis, totalEnriched, ctx);
      throw new Error(formatBatchError(err, b, batches));
    }

    const enrichment = parseEnrichResponse(response);
    if (!enrichment) {
      // Dump failed response for debugging (to workDir, not .sdd-forge/output/)
      const dumpDir = resolveWorkDir(root, config);
      fs.mkdirSync(dumpDir, { recursive: true });
      const dumpPath = path.join(dumpDir, `enrich-fail-batch${b + 1}.txt`);
      try { fs.writeFileSync(dumpPath, response); } catch (_) { /* ignore */ }
      logger.log(`response preview (${response.length} chars): ${response.slice(0, 200)}...`);
      logger.log(`full response dumped to: ${path.relative(root, dumpPath)}`);
      saveProgress(root, analysis, totalEnriched, ctx);
      throw new Error(`enrich: could not parse AI response at batch ${b + 1}/${batches.length}.`);
    }

    // Merge batch results into analysis (mutates)
    const attemptsByKey = buildAttemptsByKey(analysis, batch, 1);
    const validChapterNames = new Set(chapters.map((c) => (typeof c === "string" ? c : c.chapter).replace(/\.md$/, "")));
    mergeEnrichment(analysis, enrichment, {
      batchEntries: batch,
      attemptsByKey,
      validChapters: validChapterNames,
      onWarn: (msg) => logger.log(msg),
    });

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
    process.stdout.write(JSON.stringify(analysis, null, 2) + "\n");
  } else {
    const outputPath = saveAnalysis(root, analysis);
    logger.log(`output: ${path.relative(root, outputPath)}`);
  }
}

export {
  main,
  buildEnrichPrompt,
  parseEnrichResponse,
  mergeEnrichment,
  collectEntries,
  filterByDocsExclude,
  splitIntoBatches,
  DEFAULT_BATCH_SIZE,
  DEFAULT_BATCH_LINES,
};

runIfDirect(import.meta.url, main);

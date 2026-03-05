#!/usr/bin/env node
/**
 * sdd-forge/engine/init.js
 *
 * テンプレート継承チェーンをもとにテンプレートをマージし docs/ に出力する。
 *
 * Usage:
 *   node sdd-forge/engine/init.js [--type php-mvc] [--force]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadPackageField, loadJsonFile } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { callAgent, resolveAgent } from "../../lib/agent.js";
import { resolveChain, collectChapters, filterChapters } from "../lib/template-merger.js";
import { summaryToText } from "../lib/forge-prompts.js";
import { createLogger } from "../../lib/progress.js";
import { createI18n } from "../../lib/i18n.js";

const logger = createLogger("init");

// ---------------------------------------------------------------------------
// ブロックディレクティブ除去
// ---------------------------------------------------------------------------

/**
 * マージ済みテンプレートからブロック制御行を除去する。
 * docs/ 出力時にブロックディレクティブは不要。
 */
function stripBlockDirectives(text) {
  return text.split("\n")
    .filter((line) => {
      const t = line.trim();
      return !/^<!--\s*@(block:\s*[\w-]+|endblock|extends|parent)\s*-->$/.test(t);
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// AI 章選別
// ---------------------------------------------------------------------------

/**
 * AI エージェントで章の取捨選択を行う。
 *
 * @param {{ fileName: string, content: string }[]} chapters
 * @param {Object} analysis
 * @param {Object} agent - エージェント設定
 * @param {string} root
 * @returns {{ fileName: string, content: string }[]}
 */
function aiFilterChapters(chapters, analysis, agent, root) {
  const summary = summaryToText(analysis);
  const chapterList = chapters.map((ch) => {
    // 章タイトル（最初の # 行）を抽出
    const titleMatch = ch.content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : ch.fileName;
    return `- ${ch.fileName}: ${title}`;
  }).join("\n");

  const prompt = [
    "You are selecting documentation chapters for a software project.",
    "Based on the source code analysis summary below, determine which chapters are relevant.",
    "",
    "## Analysis Summary",
    summary,
    "",
    "## Available Chapters",
    chapterList,
    "",
    "## Rules",
    "- Always include overview chapters (01_*, 02_*, 03_*, 04_*).",
    "- Exclude chapters whose topic has zero data in the analysis (e.g. no shells → exclude batch/shell chapter).",
    "- When in doubt, include the chapter.",
    "",
    "## Output Format",
    "Return ONLY a JSON array of filenames to include. No explanation, no markdown fences.",
    'Example: ["01_overview.md", "02_stack_and_ops.md"]',
  ].join("\n");

  let response;
  try {
    response = callAgent(agent, prompt, 60000, root);
  } catch (err) {
    console.warn(`[init] WARN: AI chapter selection failed: ${err.message}`);
    return chapters;
  }

  // JSON 配列をパース（コードフェンスがあれば除去）
  let cleaned = response.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
  }

  let selected;
  try {
    selected = JSON.parse(cleaned);
  } catch (_) {
    console.warn("[init] WARN: AI response is not valid JSON, skipping AI filter.");
    console.warn(`[init]   response: ${cleaned.slice(0, 200)}`);
    return chapters;
  }

  if (!Array.isArray(selected)) {
    console.warn("[init] WARN: AI response is not an array, skipping AI filter.");
    return chapters;
  }

  const selectedSet = new Set(selected);
  const filtered = chapters.filter((ch) => selectedSet.has(ch.fileName));

  if (filtered.length === 0) {
    console.warn("[init] WARN: AI selected 0 chapters, ignoring AI filter.");
    return chapters;
  }

  const removed = chapters.filter((ch) => !selectedSet.has(ch.fileName));
  if (removed.length > 0) {
    logger.verbose(`AI filter removed: ${removed.map((ch) => ch.fileName).join(", ")}`);
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// メイン処理
// ---------------------------------------------------------------------------
function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--force", "--dry-run"],
    options: ["--type"],
    defaults: { type: "", force: false, dryRun: false },
  });
  if (cli.help) {
    console.log([
      "Usage: node sdd-forge/engine/init.js [options]",
      "",
      "テンプレートを docs/ にコピーする。",
      "",
      "Options:",
      "  --type <type>            テンプレートタイプ (default: config.json type)",
      "  --force                  既存ファイルがある場合に上書き",
      "  --dry-run                ファイル書き込みせず対象ファイル一覧を表示",
      "  -h, --help               このヘルプを表示",
    ].join("\n"));
    return;
  }

  const root = repoRoot(import.meta.url);
  const defaults = loadPackageField(root, "docsInit") || {};
  const sddConfig = loadJsonFile(path.join(root, ".sdd-forge", "config.json"));
  const t = createI18n(sddConfig?.uiLang || "en", { domain: "messages" });

  const rawType = cli.type || sddConfig?.type || defaults.defaultType;
  if (!rawType) {
    logger.log(t("init.noType"));
    process.exit(1);
  }

  const type = resolveType(rawType);
  const lang = sddConfig?.lang || "ja";

  if (type !== rawType) {
    logger.verbose(`type=${rawType} → ${type} (alias resolved) lang=${lang}`);
  } else {
    logger.verbose(`type=${type} lang=${lang}`);
  }

  // 継承チェーンの構築
  const projectLocalDir = path.join(root, ".sdd-forge", "templates", lang, "docs");
  const chain = resolveChain(type, lang, projectLocalDir);
  logger.verbose(`chain: ${chain.join(" → ")}`);

  // テンプレートマージ（project-local は resolveChain 経由でチェーンに含まれる）
  const chapters = collectChapters(chain);

  if (chapters.length === 0) {
    logger.log(t("init.noTemplates"));
    process.exit(1);
  }

  // analysis.json があれば決定的フィルタを適用
  const analysisPath = path.join(root, ".sdd-forge", "output", "analysis.json");
  let analysis = null;
  if (fs.existsSync(analysisPath)) {
    try {
      analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
      logger.verbose("analysis.json found, applying chapter filter");
    } catch (_) { /* malformed analysis.json — non-critical, skip chapter filter */ }
  }

  let filteredChapters = filterChapters(chapters, chain, analysis);
  const deterministicFiltered = chapters.length - filteredChapters.length;

  // AI 章選別（analysis + agent が揃っている場合）
  if (analysis) {
    const agent = resolveAgent(sddConfig);
    if (agent) {
      logger.verbose("AI chapter selection...");
      // summary.json があればそちらを使う（軽量）
      const summaryPath = path.join(root, ".sdd-forge", "output", "summary.json");
      let summaryData = analysis;
      if (fs.existsSync(summaryPath)) {
        try { summaryData = JSON.parse(fs.readFileSync(summaryPath, "utf8")); } catch (_) { /* use analysis */ }
      }
      filteredChapters = aiFilterChapters(filteredChapters, summaryData, agent, root);
    }
  }

  const totalFiltered = chapters.length - filteredChapters.length;
  logger.verbose(`${filteredChapters.length} template files (${totalFiltered} filtered${totalFiltered > deterministicFiltered ? `, AI: ${totalFiltered - deterministicFiltered}` : ""})`);

  // docs/ ディレクトリの準備
  const docsDir = path.join(root, "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const fileNames = filteredChapters.map((ch) => ch.fileName);
  const conflicts = fileNames.filter((f) => fs.existsSync(path.join(docsDir, f)));

  if (conflicts.length > 0 && !cli.force) {
    logger.log(t("init.conflictsExist", { count: conflicts.length }));
    for (const f of conflicts) {
      logger.log(`  - ${f}`);
    }
    logger.log(t("init.useForce"));
    process.exit(1);
  }

  if (conflicts.length > 0 && cli.force) {
    logger.verbose(`--force: overwriting ${conflicts.length} existing file(s)`);
  }

  // テンプレートを docs/ に出力
  for (const chapter of filteredChapters) {
    let text = chapter.content;

    // ブロックディレクティブを除去
    text = stripBlockDirectives(text);

    logger.verbose(`merged: ${chapter.fileName}`);

    if (!cli.dryRun) {
      const dst = path.join(docsDir, chapter.fileName);
      fs.writeFileSync(dst, text, "utf8");
    }
  }

  if (cli.dryRun) {
    console.log(`DRY-RUN: ${filteredChapters.length} files would be initialized in docs/`);
  } else {
    logger.verbose(`done. ${filteredChapters.length} files initialized in docs/`);
  }
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

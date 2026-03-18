#!/usr/bin/env node
/**
 * sdd-forge/docs/commands/scan.js
 *
 * DataSource ベースのスキャンパイプライン。
 * include/exclude glob パターンでファイルを一括収集し、
 * 各 DataSource の match() で振り分けて scan() を実行する。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { sddDataDir, sddOutputDir } from "../../lib/config.js";
import { collectFiles } from "../lib/scanner.js";
import { loadDataSources } from "../lib/data-source-loader.js";
import { presetByLeaf, resolveChainSafe } from "../../lib/presets.js";
import { createLogger } from "../../lib/progress.js";
import { translate } from "../../lib/i18n.js";
import { resolveCommandContext } from "../lib/command-context.js";

const logger = createLogger("scan");

const PRESETS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../presets",
);

function printHelp() {
  const t = translate();
  const h = t.raw("ui:help.cmdHelp.scan");
  const opts = h.options;
  console.log(
    [
      h.usage,
      "",
      h.desc,
      "",
      "Options:",
      `  ${opts.stdout}`,
      `  ${opts.dryRun}`,
      `  ${opts.help}`,
    ].join("\n"),
  );
}

/** Load DataSources that have a scan() method */
function loadScanSources(dataDir, existing) {
  return loadDataSources(dataDir, {
    existing,
    onInstance: (instance) => typeof instance.scan === "function",
  });
}

// ---------------------------------------------------------------------------
// enrichment 保持
// ---------------------------------------------------------------------------

const ENRICHED_FIELDS = ["summary", "detail", "chapter", "role"];

/**
 * オブジェクト内から hash フィールドを持つエントリーを再帰的に収集する。
 *
 * @param {Object} obj
 * @returns {Array<Object>} hash を持つエントリーの配列
 */
function collectHashEntries(obj) {
  const entries = [];
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === "object" && item.hash) {
        entries.push(item);
      }
    }
  } else if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (key === "analyzedAt" || key === "enrichedAt") continue;
      entries.push(...collectHashEntries(obj[key]));
    }
  }
  return entries;
}

/**
 * 既存 analysis.json から enriched フィールドをハッシュベースで引き継ぐ。
 * 再帰的にハッシュを検索し、任意の深さにあるエントリーの enrichment を保持する。
 *
 * @param {Object} result - 新しいスキャン結果（mutate される）
 * @param {string} outputPath - 既存 analysis.json のパス
 * @returns {number} 保持されたエントリー数
 */
function preserveEnrichment(result, outputPath) {
  let existing;
  try {
    existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } catch (_) {
    return 0;
  }

  // 既存 analysis から hash → enriched entry のルックアップを構築
  const hashMap = new Map();
  for (const item of collectHashEntries(existing)) {
    if (item.summary) {
      hashMap.set(item.hash, item);
    }
  }

  if (hashMap.size === 0) return 0;

  // 新しい結果の全エントリーに enrichment を適用
  let preserved = 0;
  for (const item of collectHashEntries(result)) {
    const prev = hashMap.get(item.hash);
    if (!prev) continue;
    for (const field of ENRICHED_FIELDS) {
      if (prev[field]) item[field] = prev[field];
    }
    preserved++;
  }

  if (preserved > 0 && existing.enrichedAt) {
    result.enrichedAt = existing.enrichedAt;
  }

  return preserved;
}

// ---------------------------------------------------------------------------
// 差分スキャン
// ---------------------------------------------------------------------------

/** analysis.json のメタデータキー（カテゴリではないトップレベルキー） */
const ANALYSIS_META_KEYS = new Set(["analyzedAt", "enrichedAt", "generatedAt", "files", "root", "_incrementalMeta"]);

/**
 * 既存 analysis から relPath → { hash, chapter } のルックアップを構築する。
 * 1パスで hash と chapter の両方を収集する。
 *
 * @param {Object} existing - 既存 analysis.json データ
 * @returns {{ hashes: Map<string, string>, chapters: Map<string, string> }}
 */
function buildExistingFileIndex(existing) {
  const hashes = new Map();
  const chapters = new Map();
  for (const entry of collectHashEntries(existing)) {
    if (!entry.file) continue;
    hashes.set(entry.file, entry.hash);
    if (entry.chapter) chapters.set(entry.file, entry.chapter);
  }
  return { hashes, chapters };
}

/**
 * カテゴリの差分を解析し、スキップ可能かどうかと変更情報を返す。
 *
 * @param {Array} matched - 現在のマッチファイル
 * @param {Object} existingCatData - 既存カテゴリデータ
 * @param {Map<string, string>} existingHashes - relPath → hash
 * @param {Map<string, string>} existingChapters - relPath → chapter
 * @param {Set<string>} currentFilePaths - 現在の全ファイルパスセット
 * @returns {{ shouldSkip: boolean, changed: Array, unchanged: Array, deleted: string[], addedCount: number }}
 */
function analyzeCategoryDelta(matched, existingCatData, existingHashes, existingChapters, currentFilePaths) {
  const existingCatEntries = collectHashEntries(existingCatData);
  const existingCatFiles = new Set(existingCatEntries.map((e) => e.file).filter(Boolean));

  const changed = [];
  const unchanged = [];
  let addedCount = 0;

  for (const f of matched) {
    const oldHash = existingHashes.get(f.relPath);
    if (oldHash && oldHash === f.hash) {
      unchanged.push(f);
    } else {
      changed.push(f);
      if (!oldHash) addedCount++;
    }
  }

  const deleted = [];
  for (const existFile of existingCatFiles) {
    if (!currentFilePaths.has(existFile)) {
      deleted.push(existFile);
    }
  }

  const shouldSkip = changed.length === 0 && deleted.length === 0;
  return { shouldSkip, changed, unchanged, deleted, addedCount };
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function main(ctx) {
  // CLI モード: 引数をパースしてコンテキストを構築
  if (!ctx) {
    const cli = parseArgs(process.argv.slice(2), {
      flags: ["--stdout", "--dry-run"],
      defaults: { stdout: false, dryRun: false },
    });
    if (cli.help) {
      printHelp();
      return;
    }
    ctx = resolveCommandContext(cli);
    ctx.dryRun = cli.dryRun;
    ctx.stdout = cli.stdout;
  }

  const { root, srcRoot: src, config: cfg, type } = ctx;

  logger.verbose(`type=${type}`);

  // preset からスキャン設定を取得
  // type が配列の場合は最初の要素を使用（scan は主要 preset のパターンで実行）
  const primaryType = Array.isArray(type) ? type[0] : type;
  const preset = presetByLeaf(primaryType);
  const presetScan = preset?.scan || {};

  // config.json に scan があれば preset を完全置換、なければ preset のデフォルトを使用
  const scanConfig = cfg.scan || presetScan;

  // glob パターンでファイルを一括収集
  const files = collectFiles(src, scanConfig.include || [], scanConfig.exclude);
  logger.verbose(`collected ${files.length} files`);

  // DataSource ロード: parent チェーン（root → leaf）+ project
  const chain = resolveChainSafe(primaryType);

  let dataSources = new Map();
  for (const p of chain) {
    dataSources = await loadScanSources(path.join(p.dir, "data"), dataSources);
  }

  const projectDataDir = sddDataDir(root);
  dataSources = await loadScanSources(projectDataDir, dataSources);

  // 既存 analysis.json を読み込み（差分スキャン用）
  const outputDir = sddOutputDir(root);
  const outputPath = path.join(outputDir, "analysis.json");
  let existing = null;
  if (!ctx.stdout && !ctx.dryRun) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    } catch (_) {
      // ファイルなし → フルスキャン
    }
  }

  const { hashes: existingHashes, chapters: existingChapters } = existing
    ? buildExistingFileIndex(existing)
    : { hashes: new Map(), chapters: new Map() };
  const currentFilePaths = new Set(files.map((f) => f.relPath));

  // 差分スキャン統計
  const stats = { unchanged: 0, changed: 0, added: 0, deleted: 0, skippedCategories: 0 };
  const changedFiles = [];
  const prevChapters = new Set();

  // DataSource の match() で振り分けて scan() を実行
  const result = { analyzedAt: new Date().toISOString() };

  for (const [name, source] of dataSources) {
    logger.verbose(`${name} ...`);
    const matched = files.filter((f) => source.match(f));

    // 差分判定: 既存カテゴリがある場合のみ
    if (existing && existing[name]) {
      const delta = analyzeCategoryDelta(matched, existing[name], existingHashes, existingChapters, currentFilePaths);

      if (delta.shouldSkip) {
        result[name] = existing[name];
        stats.unchanged += delta.unchanged.length;
        stats.skippedCategories++;
        logger.verbose(`${name}: no changes, skipped`);
        continue;
      }

      // 変更ファイルの旧 chapter を記録
      for (const f of delta.changed) {
        changedFiles.push(f.relPath);
        const oldChapter = existingChapters.get(f.relPath);
        if (oldChapter) prevChapters.add(oldChapter);
        if (existingHashes.has(f.relPath)) stats.changed++;
      }
      stats.added += delta.addedCount;
      for (const delFile of delta.deleted) {
        stats.deleted++;
        const oldChapter = existingChapters.get(delFile);
        if (oldChapter) prevChapters.add(oldChapter);
      }
      stats.unchanged += delta.unchanged.length;
    }

    // スキャン実行（全マッチファイル対象 — summary の正確性のため）
    const data = source.scan(matched);
    if (data == null) continue;

    result[name] = data;

    if (data.summary?.total != null) {
      logger.verbose(`${name}: ${data.summary.total} items`);
    } else {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        logger.verbose(`${name}: ${keys.join(", ")}`);
      }
    }
  }

  // enrichment 保持: 再スキャンされたカテゴリのハッシュ一致エントリーに enrichment を引き継ぐ
  if (existing && !ctx.stdout && !ctx.dryRun) {
    const preserved = preserveEnrichment(result, outputPath);
    if (preserved > 0) {
      logger.log(`preserved enrichment for ${preserved} unchanged entries`);
    }
  }

  // 差分メタデータを記録（text の影響章特定に使用）
  if (existing && changedFiles.length > 0) {
    result._incrementalMeta = {
      changedFiles,
      prevChapters: [...prevChapters],
    };
  }

  // 差分スキャンのログ出力
  if (existing) {
    const parts = [];
    if (stats.changed > 0) parts.push(`${stats.changed} changed`);
    if (stats.added > 0) parts.push(`${stats.added} added`);
    if (stats.deleted > 0) parts.push(`${stats.deleted} deleted`);
    if (stats.unchanged > 0) parts.push(`${stats.unchanged} unchanged`);
    if (stats.skippedCategories > 0) parts.push(`${stats.skippedCategories} categories skipped`);
    if (parts.length > 0) {
      logger.log(`incremental: ${parts.join(", ")}`);
    }
  }

  // 出力
  const json = JSON.stringify(result);

  if (ctx.stdout || ctx.dryRun) {
    process.stdout.write(json + "\n");
  } else {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, json + "\n");
    logger.log(`output: ${path.relative(root, outputPath)}`);
  }
}

export { main };

runIfDirect(import.meta.url, main);

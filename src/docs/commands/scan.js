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
import { presetByLeaf } from "../../lib/presets.js";
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
  const leaf = type.split("/").pop();
  const arch = type.split("/")[0];
  const preset = presetByLeaf(leaf);
  const presetScan = preset?.scan || {};

  // config.json に scan があれば preset を完全置換、なければ preset のデフォルトを使用
  const scanConfig = cfg.scan || presetScan;

  // glob パターンでファイルを一括収集
  const files = collectFiles(src, scanConfig.include || [], scanConfig.exclude);
  logger.verbose(`collected ${files.length} files`);

  // DataSource ロード: base → 親 preset → 子 preset（子が親を override）
  const baseDataDir = path.join(PRESETS_DIR, "base", "data");
  let dataSources = await loadScanSources(baseDataDir);

  const parentDataDir = path.join(PRESETS_DIR, arch, "data");
  dataSources = await loadScanSources(parentDataDir, dataSources);

  if (preset?.dir) {
    dataSources = await loadScanSources(
      path.join(preset.dir, "data"),
      dataSources,
    );
  }

  const projectDataDir = sddDataDir(root);
  dataSources = await loadScanSources(projectDataDir, dataSources);

  // DataSource の match() で振り分けて scan() を実行
  const result = { analyzedAt: new Date().toISOString() };

  for (const [name, source] of dataSources) {
    logger.verbose(`${name} ...`);
    const matched = files.filter((f) => source.match(f));
    const data = source.scan(matched);
    if (data == null) continue;

    // 全結果をトップレベルに DataSource 名で格納
    result[name] = data;

    // ログ出力: summary があれば total を表示
    if (data.summary?.total != null) {
      logger.verbose(`${name}: ${data.summary.total} items`);
    } else {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        logger.verbose(`${name}: ${keys.join(", ")}`);
      }
    }
  }

  // enrichment 保持: 既存ファイルからハッシュ一致エントリーの enriched フィールドを引き継ぐ
  const outputDir = sddOutputDir(root);
  const outputPath = path.join(outputDir, "analysis.json");
  if (!ctx.stdout && !ctx.dryRun) {
    const preserved = preserveEnrichment(result, outputPath);
    if (preserved > 0) {
      logger.log(`preserved enrichment for ${preserved} unchanged entries`);
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

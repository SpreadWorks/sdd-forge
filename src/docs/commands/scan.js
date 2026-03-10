#!/usr/bin/env node
/**
 * sdd-forge/docs/commands/scan.js
 *
 * DataSource ベースのスキャンパイプライン。
 * 親 preset (webapp/cli) → 子 preset の順で DataSource をロードし、
 * 各 DataSource の scan() を実行して analysis.json を生成する。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadLang, sddDataDir, sddOutputDir } from "../../lib/config.js";
import { analyzeExtras } from "../lib/scanner.js";
import { loadDataSources } from "../lib/data-source-loader.js";
import { presetByLeaf } from "../../lib/presets.js";
import { createLogger } from "../../lib/progress.js";
import { createI18n } from "../../lib/i18n.js";
import { resolveCommandContext } from "../lib/command-context.js";

const logger = createLogger("scan");

const PRESETS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../presets",
);

function printHelp(t) {
  const h = t.raw("help.cmdHelp.scan");
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
 * 既存 analysis.json から enriched フィールドをハッシュベースで引き継ぐ。
 * ファイルの hash が一致するエントリーのみ summary/detail/chapter/role を保持する。
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

  let preserved = 0;

  for (const cat of Object.keys(result)) {
    const newItems = result[cat]?.[cat];
    if (!Array.isArray(newItems)) continue;

    const oldItems = existing[cat]?.[cat];
    if (!Array.isArray(oldItems)) continue;

    // hash → enriched entry lookup
    const hashMap = new Map();
    for (const item of oldItems) {
      if (item.hash && item.summary) {
        hashMap.set(item.hash, item);
      }
    }

    for (const item of newItems) {
      if (!item.hash) continue;
      const prev = hashMap.get(item.hash);
      if (!prev) continue;
      for (const field of ENRICHED_FIELDS) {
        if (prev[field]) item[field] = prev[field];
      }
      preserved++;
    }
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
      const root = repoRoot(import.meta.url);
      printHelp(createI18n(loadLang(root)));
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
  const scanOverrides = cfg.scan || {};
  const scanCfg = { ...presetScan, ...scanOverrides };

  // DataSource ロード: 親 preset → 子 preset（子が親を override）
  const parentDataDir = path.join(PRESETS_DIR, arch, "data");
  let dataSources = await loadScanSources(parentDataDir);

  if (preset?.dir) {
    dataSources = await loadScanSources(
      path.join(preset.dir, "data"),
      dataSources,
    );
  }

  const projectDataDir = sddDataDir(root);
  dataSources = await loadScanSources(projectDataDir, dataSources);

  // スキャン実行
  const result = { analyzedAt: new Date().toISOString() };

  for (const [name, source] of dataSources) {
    logger.verbose(`${name} ...`);
    const data = source.scan(src, scanCfg);
    if (data == null) continue;

    if (data.summary) {
      // プライマリカテゴリ → analysis[name]
      result[name] = data;
      if (data.summary.total != null) {
        logger.verbose(`${name}: ${data.summary.total} items`);
      }
    } else {
      // エクストラカテゴリ → analysis.extras にマージ
      if (!result.extras) result.extras = {};
      Object.assign(result.extras, data);
    }
  }

  // 汎用 extras（composer.json / package.json）
  logger.verbose("extras ...");
  const universalExtras = analyzeExtras(src);
  // DataSource extras が汎用 extras を override（FW 固有の方が詳細）
  result.extras = { ...universalExtras, ...(result.extras || {}) };

  const extrasKeys = Object.keys(result.extras);
  if (extrasKeys.length > 0) {
    logger.verbose(`extras: ${extrasKeys.length} categories (${extrasKeys.join(", ")})`);
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

#!/usr/bin/env node
/**
 * sdd-forge/analyzers/scan.js
 *
 * 全解析器を実行し、結合結果を .sdd-forge/output/analysis.json へ出力する。
 *
 * 1. 汎用スキャン（generic-scan.js）で構造解析
 * 2. FW 固有モジュール（fw/*.js）で extras を拡張
 * 3. --legacy フラグで旧 CakePHP 固有解析器も使用可能（後方互換）
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot, sourceRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { genericScan } from "../lib/scanner.js";
import { presetByLeaf } from "../../lib/presets.js";
import { createLogger } from "../../lib/progress.js";

const logger = createLogger("scan");

/**
 * type パスからリーフセグメント（FW 名）を抽出する。
 * 例: "webapp/cakephp2" → "cakephp2"
 *     "webapp" → "webapp"
 */
function leafSegment(typePath) {
  const parts = typePath.split("/");
  return parts[parts.length - 1];
}

function printHelp() {
  console.log(
    [
      "Usage: sdd-forge scan [options]",
      "",
      "Options:",
      "  --stdout        結果を stdout に出力（ファイル書き込みしない）",
      "  --dry-run       --stdout と同じ（ファイル書き込みしない）",
      "  -h, --help      このヘルプを表示",
    ].join("\n"),
  );
}

/**
 * analysis から AI 向けサマリーを構築する。
 * 各セクションの summary + 代表的な詳細（件数制限付き）を含む。
 */

// 既知カテゴリのサマリー構築関数
const SUMMARY_BUILDERS = {
  controllers(c) {
    return {
      ...c.summary,
      top: c.controllers.slice(0, 10).map((x) => ({
        className: x.className,
        actions: x.actions.slice(0, 8),
      })),
    };
  },
  models(m) {
    return { ...m.summary };
  },
  shells(sh) {
    return {
      ...sh.summary,
      items: sh.shells.map((x) => ({
        className: x.className,
        methods: x.publicMethods,
      })),
    };
  },
  routes(r) {
    return { ...r.summary };
  },
};

const SUMMARY_SKIP_KEYS = new Set(["analyzedAt", "extras", "files"]);

function buildSummary(analysis) {
  const s = { analyzedAt: analysis.analyzedAt };

  for (const key of Object.keys(analysis)) {
    if (SUMMARY_SKIP_KEYS.has(key)) continue;
    if (!analysis[key]?.summary) continue;

    if (SUMMARY_BUILDERS[key]) {
      s[key] = SUMMARY_BUILDERS[key](analysis[key]);
    } else {
      // 汎用カテゴリ: summary + 先頭 10 件の items
      const data = analysis[key];
      const items = data[key] || [];
      s[key] = {
        ...data.summary,
        items: items.slice(0, 10).map((x) => ({
          file: x.file,
          className: x.className,
          methods: (x.methods || []).slice(0, 8),
        })),
      };
    }
  }

  if (analysis.extras) {
    const e = analysis.extras;
    s.extras = {};
    const pick = ["composerDeps", "packageDeps", "appController", "constants", "appModel"];
    for (const k of pick) {
      if (e[k]) s.extras[k] = e[k];
    }
  }
  if (analysis.files) {
    s.files = analysis.files;
  }

  return s;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--stdout", "--dry-run"],
    defaults: { stdout: false, dryRun: false },
  });
  if (cli.help) {
    printHelp();
    return;
  }

  const root = repoRoot(import.meta.url);
  const src = sourceRoot();
  const cfg = loadConfig(root);
  const rawType = cfg.type || "php-mvc";
  const type = resolveType(rawType);

  logger.verbose(`mode: generic (type=${type})`);

  // preset からスキャン設定を取得
  const leaf = leafSegment(type);
  const preset = presetByLeaf(leaf);
  const presetScan = preset?.scan || {};

  const scanOverrides = cfg.scan || {};
  // preset.scan → config.scan で上書き
  const scanCfg = { ...presetScan, ...scanOverrides };

  const result = genericScan(src, scanCfg);

  // FW 固有 extras 拡張
  if (preset?.dir) {
    const extrasPath = path.join(preset.dir, "scan", "extras.js");
    if (fs.existsSync(extrasPath)) {
      try {
        const fwModule = await import(extrasPath);
        if (fwModule.analyzeExtras) {
          logger.verbose(`FW extras: ${leaf} ...`);
          const fwExtras = await fwModule.analyzeExtras(src, result);
          result.extras = { ...result.extras, ...fwExtras };
          const extrasKeys = Object.keys(result.extras);
          logger.verbose(`FW extras: ${extrasKeys.length} categories (${extrasKeys.join(", ")})`);
        }
      } catch (err) {
        logger.verbose(`FW extras failed for ${leaf}: ${err.message}`);
      }
    }
  }

  const json = JSON.stringify(result);

  if (cli.stdout || cli.dryRun) {
    process.stdout.write(json + "\n");
  } else {
    const outputDir = path.join(root, ".sdd-forge", "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, "analysis.json");
    fs.writeFileSync(outputPath, json + "\n");
    logger.log(`output: ${path.relative(root, outputPath)}`);

    const summary = buildSummary(result);
    const summaryPath = path.join(outputDir, "summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(summary) + "\n");
    logger.log(`output: ${path.relative(root, summaryPath)}`);
  }
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

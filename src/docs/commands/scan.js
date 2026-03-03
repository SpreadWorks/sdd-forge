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
import { presetByLeaf } from "../presets/registry.js";
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
      "  --legacy        旧 CakePHP 固有解析器を使用",
      "  --stdout        結果を stdout に出力（ファイル書き込みしない）",
      "  --dry-run       --stdout と同じ（ファイル書き込みしない）",
      "  -h, --help      このヘルプを表示",
    ].join("\n"),
  );
}

async function runLegacy(cli, root) {
  const appDir = path.join(sourceRoot(), "app");
  if (!fs.existsSync(appDir)) {
    throw new Error(`app/ directory not found: ${appDir}`);
  }

  const { analyzeControllers } = await import("../presets/webapp/cakephp2/analyze-controllers.js");
  const { analyzeModels } = await import("../presets/webapp/cakephp2/analyze-models.js");
  const { analyzeShells } = await import("../presets/webapp/cakephp2/analyze-shells.js");
  const { analyzeRoutes } = await import("../presets/webapp/cakephp2/analyze-routes.js");
  const { analyzeExtras } = await import("../presets/webapp/cakephp2/analyze-extras.js");

  const result = { analyzedAt: new Date().toISOString() };

  logger.verbose("controllers ...");
  result.controllers = analyzeControllers(appDir);
  logger.verbose(`controllers: ${result.controllers.summary.total} files, ${result.controllers.summary.totalActions} actions`);

  logger.verbose("models ...");
  result.models = analyzeModels(appDir);
  logger.verbose(`models: ${result.models.summary.total} files (fe=${result.models.summary.feModels}, logic=${result.models.summary.logicModels})`);

  logger.verbose("shells ...");
  result.shells = analyzeShells(appDir);
  logger.verbose(`shells: ${result.shells.summary.total} files`);

  logger.verbose("routes ...");
  result.routes = analyzeRoutes(appDir);
  logger.verbose(`routes: ${result.routes.summary.total} routes`);

  logger.verbose("extras ...");
  result.extras = analyzeExtras(appDir);
  const extrasKeys = Object.keys(result.extras);
  logger.verbose(`extras: ${extrasKeys.length} categories (${extrasKeys.join(", ")})`);

  return result;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--stdout", "--legacy", "--dry-run"],
    defaults: { stdout: false, legacy: false, dryRun: false },
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

  let result;

  if (cli.legacy) {
    logger.verbose("mode: legacy (CakePHP-specific)");
    result = await runLegacy(cli, root);
  } else {
    logger.verbose(`mode: generic (type=${type})`);

    // FW 固有モジュールからスキャンデフォルトを取得
    const leaf = leafSegment(type);
    const preset = presetByLeaf(leaf);
    const fwModulePath = preset ? `../presets/${preset.type}/scanner.js` : null;
    let fwScanDefaults = {};

    if (fwModulePath) {
      try {
        const fwModule = await import(fwModulePath);
        if (fwModule.SCAN_DEFAULTS) {
          fwScanDefaults = fwModule.SCAN_DEFAULTS;
        }
      } catch (_) {
        logger.verbose(`no FW scanner for ${leaf}, using generic defaults`);
      }
    }

    const scanOverrides = cfg.scan || {};
    // FW デフォルト → config.scan で上書き
    const mergedOverrides = { ...fwScanDefaults, ...scanOverrides };

    result = genericScan(src, type, mergedOverrides);

    // FW 固有 extras 拡張
    if (fwModulePath) {
      try {
        const fwModule = await import(fwModulePath);
        if (fwModule.analyzeExtras) {
          logger.verbose(`FW extras: ${leaf} ...`);
          const fwExtras = await fwModule.analyzeExtras(src, result);
          result.extras = { ...result.extras, ...fwExtras };
          const extrasKeys = Object.keys(result.extras);
          logger.verbose(`FW extras: ${extrasKeys.length} categories (${extrasKeys.join(", ")})`);
        }
      } catch (_) {
        // no FW extras — already handled above
      }
    }
  }

  const json = JSON.stringify(result, null, 2);

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
  }
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

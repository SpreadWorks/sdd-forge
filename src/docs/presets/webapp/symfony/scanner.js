/**
 * sdd-forge/presets/webapp/symfony/scanner.js
 *
 * Symfony 5/6/7 固有の拡張解析。
 * SCAN_DEFAULTS と analyzeExtras を提供する。
 */

import path from "path";
import fs from "fs";

/**
 * Symfony 用のスキャンデフォルト設定。
 */
export const SCAN_DEFAULTS = {
  controllers: {
    dir: "src/Controller",
    pattern: "*.php",
    exclude: [".gitkeep"],
    lang: "php",
    subDirs: true,
  },
  models: {
    dir: "src/Entity",
    pattern: "*.php",
    lang: "php",
    subDirs: true,
  },
  shells: {
    dir: "src/Command",
    pattern: "*.php",
    lang: "php",
  },
  routes: {
    file: "config/routes.yaml",
    lang: "yaml",
  },
};

/**
 * Symfony 固有の extras 解析を実行する。
 *
 * @param {string} sourceRoot - ソースコードルート
 * @param {Object} baseScanResult - 汎用スキャンの結果
 * @returns {Promise<Object>} extras データ
 */
export async function analyzeExtras(sourceRoot, baseScanResult) {
  const srcDir = path.join(sourceRoot, "src");
  const composerJson = path.join(sourceRoot, "composer.json");
  if (!fs.existsSync(srcDir) && !fs.existsSync(composerJson)) {
    console.error("[fw/symfony] Symfony project not detected, skipping extras");
    return {};
  }

  const extras = {};

  // コントローラ解析（FW 固有）
  try {
    const { analyzeControllers } = await import("./analyze-controllers.js");
    const result = analyzeControllers(sourceRoot);
    extras.symfonyControllers = result.controllers;
  } catch (err) {
    console.error(`[fw/symfony] controller analysis failed: ${err.message}`);
  }

  // エンティティ解析（FW 固有）
  try {
    const { analyzeEntities } = await import("./analyze-entities.js");
    const result = analyzeEntities(sourceRoot);
    extras.symfonyEntities = result.entities;
  } catch (err) {
    console.error(`[fw/symfony] entity analysis failed: ${err.message}`);
  }

  // ルート解析（FW 固有）
  try {
    const { analyzeRoutes } = await import("./analyze-routes.js");
    const result = analyzeRoutes(sourceRoot);
    extras.symfonyRoutes = result.routes;
    extras.symfonyRoutesSummary = result.summary;
  } catch (err) {
    console.error(`[fw/symfony] route analysis failed: ${err.message}`);
  }

  // マイグレーション解析
  try {
    const { analyzeMigrations } = await import("./analyze-migrations.js");
    const result = analyzeMigrations(sourceRoot);
    extras.migrations = result.tables;
    extras.migrationsSummary = result.summary;
  } catch (err) {
    console.error(`[fw/symfony] migration analysis failed: ${err.message}`);
  }

  // 設定解析
  try {
    const { analyzeConfig } = await import("./analyze-config.js");
    const configExtras = analyzeConfig(sourceRoot);
    Object.assign(extras, configExtras);
  } catch (err) {
    console.error(`[fw/symfony] config analysis failed: ${err.message}`);
  }

  return extras;
}

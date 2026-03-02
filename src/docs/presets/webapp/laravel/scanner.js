/**
 * sdd-forge/presets/webapp/laravel/scanner.js
 *
 * Laravel 8+ 固有の拡張解析。
 * SCAN_DEFAULTS と analyzeExtras を提供する。
 */

import path from "path";
import fs from "fs";

/**
 * Laravel 用のスキャンデフォルト設定。
 */
export const SCAN_DEFAULTS = {
  controllers: {
    dir: "app/Http/Controllers",
    pattern: "*.php",
    exclude: ["Controller.php"],
    lang: "php",
    subDirs: true,
  },
  models: {
    dir: "app/Models",
    pattern: "*.php",
    lang: "php",
    subDirs: true,
  },
  shells: {
    dir: "app/Console/Commands",
    pattern: "*.php",
    lang: "php",
  },
  routes: {
    file: "routes/web.php",
    lang: "php",
  },
};

/**
 * Laravel 固有の extras 解析を実行する。
 *
 * @param {string} sourceRoot - ソースコードルート
 * @param {Object} baseScanResult - 汎用スキャンの結果
 * @returns {Promise<Object>} extras データ
 */
export async function analyzeExtras(sourceRoot, baseScanResult) {
  const artisan = path.join(sourceRoot, "artisan");
  const appDir = path.join(sourceRoot, "app");
  if (!fs.existsSync(artisan) && !fs.existsSync(appDir)) {
    console.error("[fw/laravel] Laravel project not detected, skipping extras");
    return {};
  }

  const extras = {};

  // コントローラ解析（FW 固有）
  try {
    const { analyzeControllers } = await import("./analyze-controllers.js");
    const result = analyzeControllers(sourceRoot);
    extras.laravelControllers = result.controllers;
  } catch (err) {
    console.error(`[fw/laravel] controller analysis failed: ${err.message}`);
  }

  // モデル解析（FW 固有）
  try {
    const { analyzeModels } = await import("./analyze-models.js");
    const result = analyzeModels(sourceRoot);
    extras.laravelModels = result.models;
  } catch (err) {
    console.error(`[fw/laravel] model analysis failed: ${err.message}`);
  }

  // ルート解析（FW 固有）
  try {
    const { analyzeRoutes } = await import("./analyze-routes.js");
    const result = analyzeRoutes(sourceRoot);
    extras.laravelRoutes = result.routes;
    extras.laravelRoutesSummary = result.summary;
  } catch (err) {
    console.error(`[fw/laravel] route analysis failed: ${err.message}`);
  }

  // マイグレーション解析
  try {
    const { analyzeMigrations } = await import("./analyze-migrations.js");
    const result = analyzeMigrations(sourceRoot);
    extras.migrations = result.tables;
    extras.migrationsSummary = result.summary;
  } catch (err) {
    console.error(`[fw/laravel] migration analysis failed: ${err.message}`);
  }

  // 設定解析
  try {
    const { analyzeConfig } = await import("./analyze-config.js");
    const configExtras = analyzeConfig(sourceRoot);
    Object.assign(extras, configExtras);
  } catch (err) {
    console.error(`[fw/laravel] config analysis failed: ${err.message}`);
  }

  return extras;
}

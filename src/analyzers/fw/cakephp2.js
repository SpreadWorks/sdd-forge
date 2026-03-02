/**
 * sdd-forge/analyzers/fw/cakephp2.js
 *
 * CakePHP 2.x 固有の拡張解析。
 * レガシー解析器群を統合し、FW 固有の extras データを生成する。
 */

import path from "path";
import fs from "fs";

/**
 * CakePHP 2.x 用のスキャンデフォルト設定。
 */
export const SCAN_DEFAULTS = {
  controllers: {
    dir: "app/Controller",
    pattern: "*Controller.php",
    exclude: ["AppController.php"],
    lang: "php",
  },
  models: {
    dir: "app/Model",
    pattern: "*.php",
    exclude: ["AppModel.php"],
    subDirs: true,
    lang: "php",
  },
  shells: {
    dir: "app/Console/Command",
    pattern: "*Shell.php",
    exclude: ["AppShell.php"],
    lang: "php",
  },
  routes: {
    file: "app/Config/routes.php",
    lang: "php",
  },
};

/**
 * CakePHP 固有の extras 解析を実行する。
 * レガシー analyzeExtras を呼び出し、結果をマージする。
 *
 * @param {string} sourceRoot - ソースコードルート
 * @param {Object} baseScanResult - 汎用スキャンの結果
 * @returns {Promise<Object>} extras データ
 */
export async function analyzeExtras(sourceRoot, baseScanResult) {
  const appDir = path.join(sourceRoot, "app");
  if (!fs.existsSync(appDir)) {
    console.error("[fw/cakephp2] app/ directory not found, skipping extras");
    return {};
  }

  // レガシー extras 解析器を動的 import
  const { analyzeExtras: legacyExtras } = await import("../analyze-extras.js");
  const extras = legacyExtras(appDir);

  // composer.json があれば依存関係を追加（レガシー extras で未カバーの場合）
  if (!extras.composerDeps) {
    const composerPath = path.join(sourceRoot, "composer.json");
    if (fs.existsSync(composerPath)) {
      try {
        const composer = JSON.parse(fs.readFileSync(composerPath, "utf8"));
        extras.composerDeps = {
          require: composer.require || {},
          requireDev: composer["require-dev"] || {},
        };
      } catch (_) { /* ignore */ }
    }
  }

  return extras;
}

/**
 * sdd-forge/lib/config.js
 *
 * JSON / package.json 読み込みユーティリティ + SDD 設定管理。
 */

import fs from "fs";
import path from "path";
import { validateConfig, validateContext } from "./types.js";

/**
 * JSON ファイルを読み込む。存在しなければ throw する。
 *
 * @param {string} filePath - 読み込む JSON ファイルの絶対パス
 * @returns {Object} パース済みオブジェクト
 */
export function loadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/**
 * package.json の任意フィールドを読み込む。
 * 存在しないかパースに失敗した場合は undefined を返す。
 *
 * @param {string} root  - リポジトリルート
 * @param {string} field - 取得するフィールド名
 * @returns {*} フィールドの値、または undefined
 */
export function loadPackageField(root, field) {
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) return undefined;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return pkg[field];
  } catch (_) {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// .sdd-forge パスヘルパー
// ---------------------------------------------------------------------------

const SDD_DIR_NAME = ".sdd-forge";

export function sddDir(root) {
  return path.join(root, SDD_DIR_NAME);
}

export function sddConfigPath(root) {
  return path.join(root, SDD_DIR_NAME, "config.json");
}

export function sddOutputDir(root) {
  return path.join(root, SDD_DIR_NAME, "output");
}

export function sddDataDir(root) {
  return path.join(root, SDD_DIR_NAME, "data");
}

/**
 * .sdd-forge/config.json から uiLang を読み込む。
 * ファイルが存在しないかパースに失敗した場合は "en" を返す。
 *
 * @param {string} root - リポジトリルート
 * @returns {string}
 */
export function loadUiLang(root) {
  try {
    const raw = JSON.parse(fs.readFileSync(sddConfigPath(root), "utf8"));
    return raw.uiLang || "en";
  } catch (_) {
    return "en";
  }
}

/**
 * config から docs 生成用の言語を解決する。
 * 優先順位: config.lang → config.output.default → fallback ("ja")
 *
 * @param {Object} cfg - SddConfig オブジェクト
 * @param {string} [fallback="ja"] - フォールバック言語
 * @returns {string}
 */
export function resolveDocLang(cfg, fallback) {
  return cfg?.lang || cfg?.output?.default || fallback || "ja";
}

// ---------------------------------------------------------------------------
// SDD 設定管理
// ---------------------------------------------------------------------------

/**
 * .sdd-forge/config.json を読み込みバリデーションする。
 *
 * @param {string} root - リポジトリルート
 * @returns {import("./types.js").SddConfig}
 */
export function loadConfig(root) {
  const raw = loadJsonFile(sddConfigPath(root));
  return validateConfig(raw);
}

/**
 * .sdd-forge/context.json を読み込む。ファイルがなければ空オブジェクトを返す。
 *
 * @param {string} root - リポジトリルート
 * @returns {import("./types.js").SddContext}
 */
export function loadContext(root) {
  const ctxPath = path.join(sddDir(root), "context.json");
  if (!fs.existsSync(ctxPath)) return {};
  const raw = JSON.parse(fs.readFileSync(ctxPath, "utf8"));
  return validateContext(raw);
}

/**
 * .sdd-forge/context.json に書き込む。
 *
 * @param {string} root - リポジトリルート
 * @param {import("./types.js").SddContext} data - 書き込むデータ
 */
export function saveContext(root, data) {
  const ctxPath = path.join(sddDir(root), "context.json");
  const dir = path.dirname(ctxPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(ctxPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * プロジェクトコンテキスト文字列を解決する。
 * 優先順位: context.json → config.json の textFill.projectContext → 空文字列
 *
 * @param {string} root - リポジトリルート
 * @returns {string}
 */
export function resolveProjectContext(root) {
  const ctx = loadContext(root);
  if (ctx.projectContext) return ctx.projectContext;

  const cfgPath = sddConfigPath(root);
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      if (cfg.textFill?.projectContext) return cfg.textFill.projectContext;
    } catch (_) {
      // ignore
    }
  }

  return "";
}

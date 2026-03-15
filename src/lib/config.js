/**
 * sdd-forge/lib/config.js
 *
 * JSON / package.json 読み込みユーティリティ + SDD 設定管理。
 */

import fs from "fs";
import path from "path";
import { validateConfig } from "./types.js";

/** Default concurrency for parallel file processing. */
export const DEFAULT_CONCURRENCY = 5;

/** Default fallback language when config is unavailable or lang is unset. */
export const DEFAULT_LANG = "en";

/**
 * Resolve concurrency from config, falling back to DEFAULT_CONCURRENCY.
 *
 * @param {Object} cfg - SDD config object
 * @returns {number}
 */
export function resolveConcurrency(cfg) {
  return Number(cfg.concurrency || 0) || DEFAULT_CONCURRENCY;
}

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
 * .sdd-forge/config.json から lang を読み込む。
 * ファイルが存在しないかパースに失敗した場合は "en" を返す。
 * ヘルプ表示など、バリデーション前に言語が必要な場面で使用する。
 *
 * @param {string} root - リポジトリルート
 * @returns {string}
 */
export function loadLang(root) {
  try {
    const raw = JSON.parse(fs.readFileSync(sddConfigPath(root), "utf8"));
    return raw.lang || DEFAULT_LANG;
  } catch (_) {
    return DEFAULT_LANG;
  }
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


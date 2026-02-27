/**
 * tools/lib/config.js
 *
 * JSON / package.json 読み込みユーティリティ。
 */

import fs from "fs";
import path from "path";

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

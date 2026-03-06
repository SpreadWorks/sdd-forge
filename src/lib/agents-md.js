/**
 * src/lib/agents-md.js
 *
 * AGENTS.md の SDD セクションテンプレート読み込みユーティリティ。
 * setup.js から利用する。
 */

import fs from "fs";
import path from "path";
import { PRESETS_DIR } from "./presets.js";

/**
 * SDD セクションテンプレートを読み込む。
 * 指定ロケールが無ければ "en" にフォールバックする。
 *
 * @param {string} lang - ロケールコード
 * @returns {string} SDD セクション markdown（見つからなければ空文字列）
 */
export function loadSddTemplate(lang) {
  for (const l of [lang, "en"]) {
    const p = path.join(PRESETS_DIR, "base", "templates", l, "AGENTS.sdd.md");
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  return "";
}

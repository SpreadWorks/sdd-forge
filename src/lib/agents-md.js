/**
 * src/lib/agents-md.js
 *
 * AGENTS.md の SDD セクション操作ユーティリティ。
 * setup.js と agents.js から共通利用する。
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

/**
 * AGENTS.md の SDD セクションをテンプレートで差し替える。
 * 既存の SDD:START〜SDD:END ブロックがあれば置換、なければ先頭に挿入する。
 *
 * @param {string} filePath - AGENTS.md の絶対パス
 * @param {string} sddSection - 差し替える SDD セクション全体
 */
export function updateSddSection(filePath, sddSection) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} not found. Run 'sdd-forge setup' first.`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  const sddPattern = /<!-- SDD:START[^>]*-->[\s\S]*?<!-- SDD:END -->/;
  let updated;
  if (sddPattern.test(content)) {
    updated = content.replace(sddPattern, sddSection.trim());
  } else {
    updated = sddSection + "\n\n" + content;
  }
  fs.writeFileSync(filePath, updated, "utf8");
}

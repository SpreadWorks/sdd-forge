/**
 * src/lib/json-parse.js
 *
 * AI レスポンスから JSON を安全に抽出するユーティリティ。
 */

/**
 * 括弧の対応を数えて最初の完全な JSON オブジェクトを抽出する。
 * 貪欲 regex (/\{[\s\S]*\}/) は AI が末尾に余分な括弧を出力した場合に
 * オーバーシュートするため、bracket-balanced で抽出する。
 *
 * @param {string} text - JSON を含むテキスト
 * @returns {string|null} 抽出された JSON 文字列、見つからなければ null
 */
export function extractBalancedJson(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

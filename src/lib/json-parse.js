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
/**
 * JSON 文字列値内のエスケープされていないダブルクォーテーションを修復する。
 * AI が `commandId: "docs.translate"` のような未エスケープ引用符を含めるケース対策。
 * 整形済み JSON（複数行）と minified JSON（1行）の両方に対応。
 *
 * @param {string} json - 壊れた JSON 文字列
 * @returns {string} 修復された JSON 文字列
 */
export function fixUnescapedQuotes(json) {
  const out = [];
  let i = 0;
  const len = json.length;

  while (i < len) {
    const ch = json[i];

    if (ch !== '"') {
      out.push(ch);
      i++;
      continue;
    }

    // Opening quote of a JSON string
    out.push(ch);
    i++;

    while (i < len) {
      const c = json[i];

      if (c === "\\") {
        const next = json[i + 1];
        // Valid JSON escape sequences: " \ / b f n r t u
        if (next && '"\\/bfnrtu'.includes(next)) {
          out.push(c);
          out.push(next);
          i += 2;
        } else {
          // Invalid escape (e.g. \` ) — drop the backslash, keep the char
          i++;
        }
        continue;
      }

      if (c === '"') {
        // Look ahead to find the next non-whitespace char after this quote
        const next = json[i + 1];
        let nextNonWs = i + 1;
        while (nextNonWs < len && (json[nextNonWs] === " " || json[nextNonWs] === "\t" || json[nextNonWs] === "\n" || json[nextNonWs] === "\r")) {
          nextNonWs++;
        }
        const afterWs = json[nextNonWs];
        // Real end of string if followed by (optional whitespace +) JSON structural chars or EOF
        if (afterWs === undefined || afterWs === "," || afterWs === "}" || afterWs === "]" || afterWs === ":") {
          out.push(c);
          i++;
          break;
        }
        // Unescaped quote inside a string value
        out.push('\\"');
        i++;
        continue;
      }

      out.push(c);
      i++;
    }
  }

  return out.join("");
}

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

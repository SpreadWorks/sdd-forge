/**
 * tools/engine/directive-parser.js
 *
 * テンプレート内の @data / @text ディレクティブを抽出する。
 *
 * ディレクティブ構文:
 *   <!-- @data: <renderer>(<category>, labels=<label1>|<label2>|...) -->
 *   <!-- @text: <prompt text> -->
 *   <!-- @text[id=foo, maxLines=5]: <prompt text> -->
 */

/**
 * @typedef {Object} DataDirective
 * @property {"data"} type
 * @property {string} renderer   - table | kv | mermaid-er | bool-matrix
 * @property {string} category   - 汎用カテゴリ名
 * @property {string[]} labels   - テーブルヘッダー表示名
 * @property {string} raw        - ディレクティブ行の全文
 * @property {number} line        - 行番号 (0-based)
 */

/**
 * @typedef {Object} TextDirective
 * @property {"text"} type
 * @property {string} prompt     - LLM に渡すプロンプト
 * @property {Object} params     - オプショナルパラメータ (例: { id: "auth", maxLines: 5, maxChars: 500 })
 * @property {string} raw        - ディレクティブ行の全文
 * @property {number} line        - 行番号 (0-based)
 */

const DATA_RE = /^<!--\s*@data:\s*([\w-]+)\(([^,)]+)(?:,\s*labels=([^)]+))?\)\s*-->$/;
const TEXT_RE = /^<!--\s*@text\s*(?:\[([^\]]*)\])?\s*:\s*(.+?)\s*-->$/;

/**
 * テキストフィルのパラメータ文字列をパースする。
 * 例: "maxLines=5, maxChars=500" → { maxLines: 5, maxChars: 500 }
 *
 * @param {string|undefined} paramStr - パラメータ文字列
 * @returns {Object} パース済みパラメータ
 */
function parseTextFillParams(paramStr) {
  if (!paramStr) return {};
  const params = {};
  for (const pair of paramStr.split(",")) {
    const [key, value] = pair.split("=").map((s) => s.trim());
    if (key && value !== undefined) {
      const num = Number(value);
      params[key] = Number.isFinite(num) ? num : value;
    }
  }
  return params;
}

/**
 * テンプレートテキストからディレクティブを抽出する。
 *
 * @param {string} text - テンプレート全文
 * @returns {Array<DataFillDirective|TextFillDirective>}
 */
export function parseDirectives(text) {
  const lines = text.split("\n");
  const directives = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    const dataMatch = trimmed.match(DATA_RE);
    if (dataMatch) {
      const labels = dataMatch[3] ? dataMatch[3].split("|").map((l) => l.trim()) : [];
      directives.push({
        type: "data",
        renderer: dataMatch[1],
        category: dataMatch[2].trim(),
        labels,
        raw: lines[i],
        line: i,
      });
      continue;
    }

    const textMatch = trimmed.match(TEXT_RE);
    if (textMatch) {
      directives.push({
        type: "text",
        prompt: textMatch[2],
        params: parseTextFillParams(textMatch[1]),
        raw: lines[i],
        line: i,
      });
      continue;
    }
  }

  return directives;
}

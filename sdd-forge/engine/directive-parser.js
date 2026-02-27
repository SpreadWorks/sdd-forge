/**
 * tools/engine/directive-parser.js
 *
 * テンプレート内の @data-fill / @text-fill ディレクティブを抽出する。
 *
 * ディレクティブ構文:
 *   <!-- @data-fill: <renderer>(<category>, labels=<label1>|<label2>|...) -->
 *   <!-- @text-fill: <prompt text> -->
 */

/**
 * @typedef {Object} DataFillDirective
 * @property {"data-fill"} type
 * @property {string} renderer   - table | kv | mermaid-er | bool-matrix
 * @property {string} category   - 汎用カテゴリ名
 * @property {string[]} labels   - テーブルヘッダー表示名
 * @property {string} raw        - ディレクティブ行の全文
 * @property {number} line        - 行番号 (0-based)
 */

/**
 * @typedef {Object} TextFillDirective
 * @property {"text-fill"} type
 * @property {string} prompt     - LLM に渡すプロンプト
 * @property {string} raw        - ディレクティブ行の全文
 * @property {number} line        - 行番号 (0-based)
 */

const DATA_FILL_RE = /^<!--\s*@data-fill:\s*([\w-]+)\(([^,)]+)(?:,\s*labels=([^)]+))?\)\s*-->$/;
const TEXT_FILL_RE = /^<!--\s*@text-fill:\s*(.+?)\s*-->$/;

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

    const dataMatch = trimmed.match(DATA_FILL_RE);
    if (dataMatch) {
      const labels = dataMatch[3] ? dataMatch[3].split("|").map((l) => l.trim()) : [];
      directives.push({
        type: "data-fill",
        renderer: dataMatch[1],
        category: dataMatch[2].trim(),
        labels,
        raw: lines[i],
        line: i,
      });
      continue;
    }

    const textMatch = trimmed.match(TEXT_FILL_RE);
    if (textMatch) {
      directives.push({
        type: "text-fill",
        prompt: textMatch[1],
        raw: lines[i],
        line: i,
      });
      continue;
    }
  }

  return directives;
}

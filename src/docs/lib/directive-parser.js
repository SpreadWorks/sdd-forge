/**
 * tools/engine/directive-parser.js
 *
 * テンプレート内の @data / @text ディレクティブを抽出する。
 * テンプレート継承用の @block / @endblock / @extends も解析する。
 *
 * ディレクティブ構文:
 *   <!-- @data: <source>.<method>("<label1>|<label2>|...") -->
 *   <!-- @text: <prompt text> -->
 *   <!-- @text[id=foo, maxLines=5]: <prompt text> -->
 *
 * ブロック継承構文:
 *   <!-- @extends -->
 *   <!-- @block: <name> -->
 *   <!-- @endblock -->
 */

/**
 * @typedef {Object} DataDirective
 * @property {"data"} type
 * @property {string} source     - DataSource 名 (e.g. "controllers")
 * @property {string} method     - メソッド名 (e.g. "list")
 * @property {string[]} labels   - テーブルヘッダー表示名
 * @property {string} raw        - ディレクティブ行の全文
 * @property {number} line       - 行番号 (0-based)
 */

/**
 * @typedef {Object} TextDirective
 * @property {"text"} type
 * @property {string} prompt     - LLM に渡すプロンプト
 * @property {Object} params     - オプショナルパラメータ (例: { id: "auth", maxLines: 5, maxChars: 500 })
 * @property {string} raw        - ディレクティブ行の全文
 * @property {number} line        - 行番号 (0-based)
 */

// <!-- @data: source.method("label1|label2|...") -->
// source は "config.constants" のようにドットを含むことがある（最後のドットで分割）
const DATA_RE = /^<!--\s*@data:\s*([\w.-]+)\.([\w-]+)\("([^"]*)"\)\s*-->$/;
const TEXT_RE = /^<!--\s*@text\s*(?:\[([^\]]*)\])?\s*:\s*(.+?)\s*-->$/;

// ブロック継承ディレクティブ
const BLOCK_START_RE = /^<!--\s*@block:\s*([\w-]+)\s*-->$/;
const BLOCK_END_RE   = /^<!--\s*@endblock\s*-->$/;
const EXTENDS_RE     = /^<!--\s*@extends\s*-->$/;

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
        source: dataMatch[1],
        method: dataMatch[2],
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

/**
 * テンプレートファイルのブロック継承構造を解析する。
 *
 * @param {string} text - テンプレート全文
 * @returns {{
 *   extends: boolean,
 *   blocks: Map<string, { name: string, content: string[] }>,
 *   preamble: string[],
 *   postamble: string[],
 * }}
 */
export function parseBlocks(text) {
  const lines = text.split("\n");
  let hasExtends = false;
  const blocks = new Map();
  const preamble = [];
  const postamble = [];

  let currentBlock = null;
  let lastBlockEndLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (EXTENDS_RE.test(trimmed)) {
      hasExtends = true;
      continue;
    }

    const blockStart = trimmed.match(BLOCK_START_RE);
    if (blockStart) {
      currentBlock = {
        name: blockStart[1],
        content: [],
      };
      continue;
    }

    if (BLOCK_END_RE.test(trimmed)) {
      if (currentBlock) {
        blocks.set(currentBlock.name, currentBlock);
        lastBlockEndLine = i;
        currentBlock = null;
      }
      continue;
    }

    if (currentBlock) {
      currentBlock.content.push(lines[i]);
      continue;
    }

    // ブロック外の行
    if (blocks.size === 0 && lastBlockEndLine === -1) {
      // まだブロックが出現していない → preamble
      preamble.push(lines[i]);
    } else {
      // 最後のブロック以降 → postamble
      postamble.push(lines[i]);
    }
  }

  return { extends: hasExtends, blocks, preamble, postamble };
}

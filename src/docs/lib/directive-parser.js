/**
 * tools/engine/directive-parser.js
 *
 * テンプレート内の {{data}} / {{text}} ディレクティブを抽出する。
 * テンプレート継承用の @block / @endblock / @extends も解析する。
 *
 * ディレクティブ構文:
 *   <!-- {{data: <source>.<method>("<label1>|<label2>|...")}} -->
 *   <!-- {{/data}} -->
 *   <!-- {{text: <prompt text>}} -->
 *   <!-- {{text[id=foo, maxLines=5]: <prompt text>}} -->
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
 * @property {number} endLine    - {{/data}} の行番号 (0-based)
 * @property {boolean} inline    - {{data}} と {{/data}} が同一行か
 * @property {string} fullRaw    - インラインの場合、行全体
 */

/**
 * @typedef {Object} TextDirective
 * @property {"text"} type
 * @property {string} prompt     - LLM に渡すプロンプト
 * @property {Object} params     - オプショナルパラメータ (例: { id: "auth", maxLines: 5, maxChars: 500 })
 * @property {string} raw        - ディレクティブ行の全文
 * @property {number} line        - 行番号 (0-based)
 */

// <!-- {{data: source.method("label1|label2|...")}} -->
// source は "config.constants" のようにドットを含むことがある（最後のドットで分割）
const DATA_RE = /^<!--\s*\{\{data:\s*([\w.-]+)\.([\w-]+)\("([^"]*)"\)\}\}\s*-->$/;
const TEXT_RE = /^<!--\s*\{\{text\s*(?:\[([^\]]*)\])?\s*:\s*(.+?)\}\}\s*-->$/;
const ENDDATA_RE = /^<!--\s*\{\{\/data\}\}\s*-->$/;

// インライン検出用: 1行内に {{data ...}} と {{/data}} がある
const INLINE_DATA_RE = /<!--\s*\{\{data:\s*([\w.-]+)\.([\w-]+)\("([^"]*)"\)\}\}\s*-->([\s\S]*?)<!--\s*\{\{\/data\}\}\s*-->/;

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
 * @returns {Array<DataDirective|TextDirective>}
 */
export function parseDirectives(text) {
  const lines = text.split("\n");
  const directives = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // インライン {{data}} チェック（1行内に {{data}} と {{/data}} がある、複数対応）
    const inlineGlobal = new RegExp(INLINE_DATA_RE.source, "g");
    const inlineMatches = [...lines[i].matchAll(inlineGlobal)];
    if (inlineMatches.length > 0) {
      for (const m of inlineMatches) {
        const labels = m[3] ? m[3].split("|").map((l) => l.trim()) : [];
        directives.push({
          type: "data",
          source: m[1],
          method: m[2],
          labels,
          raw: m[0],
          line: i,
          endLine: i,
          inline: true,
          fullRaw: lines[i],
        });
      }
      continue;
    }

    // ブロック {{data}} チェック
    const dataMatch = trimmed.match(DATA_RE);
    if (dataMatch) {
      // {{/data}} を探す
      let endLine = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (ENDDATA_RE.test(lines[j].trim())) {
          endLine = j;
          break;
        }
        // 次の {{data}} が先に来たら閉じなし（エラー扱い）
        if (DATA_RE.test(lines[j].trim()) || INLINE_DATA_RE.test(lines[j])) {
          break;
        }
      }

      const labels = dataMatch[3] ? dataMatch[3].split("|").map((l) => l.trim()) : [];
      directives.push({
        type: "data",
        source: dataMatch[1],
        method: dataMatch[2],
        labels,
        raw: lines[i],
        line: i,
        endLine,
        inline: false,
        fullRaw: null,
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
/**
 * ブロックディレクティブの内容を置換する。
 * lines 配列を直接変更する（splice）。
 *
 * @param {string[]} lines - ファイルの行配列
 * @param {DataDirective} d - ディレクティブ
 * @param {string} content - 新しい内容
 */
export function replaceBlockDirective(lines, d, content) {
  const endDataLine = lines[d.endLine];
  const newLines = [d.raw, content, endDataLine];
  lines.splice(d.line, d.endLine - d.line + 1, ...newLines);
}

/**
 * テンプレート内の {{data}} ディレクティブを一括解決する。
 * 逆順ループ + インライン/ブロック置換の共通処理。
 *
 * @param {string} text - テンプレート全文
 * @param {function} resolveFn - (source, method, labels) => rendered string | null
 * @param {Object} [opts]
 * @param {function} [opts.onResolve] - (directive, rendered) => void — 解決時コールバック
 * @param {function} [opts.onSkip] - (directive) => void — data 以外のディレクティブ時コールバック
 * @returns {{ text: string, replaced: number }}
 */
export function resolveDataDirectives(text, resolveFn, opts) {
  const { onResolve, onSkip } = opts || {};
  const directives = parseDirectives(text);
  if (directives.length === 0) return { text, replaced: 0 };

  const lines = text.split("\n");
  let replaced = 0;

  for (let i = directives.length - 1; i >= 0; i--) {
    const d = directives[i];

    if (d.type !== "data") {
      if (onSkip) onSkip(d);
      continue;
    }

    const rendered = resolveFn(d.source, d.method, d.labels);
    if (rendered === null || rendered === undefined) continue;

    if (onResolve) onResolve(d, rendered);

    if (d.inline) {
      const openTag = d.raw.match(/<!--\s*\{\{data:\s*[\w.-]+\.[\w-]+\("[^"]*"\)\s*\}\}\s*-->/)[0];
      const endTag = "<!-- {{/data}} -->";
      lines[d.line] = lines[d.line].replace(d.raw, `${openTag}${rendered}${endTag}`);
      replaced++;
    } else if (d.endLine >= 0) {
      replaceBlockDirective(lines, d, rendered);
      replaced++;
    }
  }

  return { text: lines.join("\n"), replaced };
}

/**
 * マージ済みテンプレートからブロック制御行を除去する。
 * docs/ 出力時にブロックディレクティブは不要。
 *
 * @param {string} text - テンプレートテキスト
 * @returns {string}
 */
export function stripBlockDirectives(text) {
  return text.split("\n")
    .filter((line) => {
      const t = line.trim();
      return !/^<!--\s*@(block:\s*[\w-]+|endblock|extends|parent)\s*-->$/.test(t);
    })
    .join("\n");
}

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

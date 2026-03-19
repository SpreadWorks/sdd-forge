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
 * @property {string} preset     - プリセット名 (e.g. "symfony", "base")
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

// <!-- {{data: preset.source.method("label1|label2|...")}} -->
// <!-- {{data: preset.source.method}} -->  (labels optional)
// 3+部構成: preset(1) . source(2, dotted OK) . method(3) ("labels"(4, optional))
const DATA_RE = /^<!--\s*\{\{data:\s*([\w-]+)\.([\w.-]+)\.([\w-]+)(?:\("([^"]*)"\))?\}\}\s*-->$/;
const TEXT_RE = /^<!--\s*\{\{text\s*(?:\[([^\]]*)\])?\s*:\s*(.+?)\}\}\s*-->$/;
const ENDDATA_RE = /^<!--\s*\{\{\/data\}\}\s*-->$/;
const ENDTEXT_RE = /^<!--\s*\{\{\/text\}\}\s*-->$/;

// インライン検出用: 1行内に {{data ...}} と {{/data}} がある
const INLINE_DATA_RE = /<!--\s*\{\{data:\s*([\w-]+)\.([\w.-]+)\.([\w-]+)(?:\("([^"]*)"\))?\}\}\s*-->([\s\S]*?)<!--\s*\{\{\/data\}\}\s*-->/;

// ブロック継承ディレクティブ
const BLOCK_START_RE = /^<!--\s*@block:\s*([\w-]+)\s*-->$/;
const BLOCK_END_RE   = /^<!--\s*@endblock\s*-->$/;
const EXTENDS_RE     = /^<!--\s*@extends\s*-->$/;

// header/footer ディレクティブ（data ブロック内で使用）
const HEADER_OPEN_RE  = /^<!--\s*\{\{header\}\}\s*-->$/;
const HEADER_CLOSE_RE = /^<!--\s*\{\{\/header\}\}\s*-->$/;
const FOOTER_OPEN_RE  = /^<!--\s*\{\{footer\}\}\s*-->$/;
const FOOTER_CLOSE_RE = /^<!--\s*\{\{\/footer\}\}\s*-->$/;

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
        const labels = m[4] ? m[4].split("|").map((l) => l.trim()) : [];
        directives.push({
          type: "data",
          preset: m[1],
          source: m[2],
          method: m[3],
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

      const labels = dataMatch[4] ? dataMatch[4].split("|").map((l) => l.trim()) : [];
      directives.push({
        type: "data",
        preset: dataMatch[1],
        source: dataMatch[2],
        method: dataMatch[3],
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
      // {{/text}} を探す
      let endLine = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (ENDTEXT_RE.test(lines[j].trim())) {
          endLine = j;
          break;
        }
        // 次の {{text}} が先に来たら閉じなし
        if (TEXT_RE.test(lines[j].trim())) {
          break;
        }
      }

      directives.push({
        type: "text",
        prompt: textMatch[2],
        params: parseTextFillParams(textMatch[1]),
        raw: lines[i],
        line: i,
        endLine,
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
 * data ブロック内の header/footer 領域を検出する。
 *
 * @param {string[]} lines
 * @param {number} startLine - {{data}} 行
 * @param {number} endLine   - {{/data}} 行
 * @returns {{ header: { start: number, end: number, content: string[] }|null, footer: { start: number, end: number, content: string[] }|null }}
 */
function findHeaderFooter(lines, startLine, endLine) {
  let header = null;
  let footer = null;

  for (let i = startLine + 1; i < endLine; i++) {
    const t = lines[i].trim();
    if (HEADER_OPEN_RE.test(t) && !header) {
      for (let j = i + 1; j <= endLine; j++) {
        if (HEADER_CLOSE_RE.test(lines[j].trim())) {
          header = { start: i, end: j, content: lines.slice(i + 1, j) };
          break;
        }
      }
    }
    if (FOOTER_OPEN_RE.test(t) && !footer) {
      for (let j = i + 1; j <= endLine; j++) {
        if (FOOTER_CLOSE_RE.test(lines[j].trim())) {
          footer = { start: i, end: j, content: lines.slice(i + 1, j) };
          break;
        }
      }
    }
  }

  return { header, footer };
}

/**
 * data が null の場合に header/footer を HTML コメント内に折り畳む。
 * lines 配列を直接変更する。
 *
 * @param {string[]} lines
 * @param {DataDirective} d
 * @returns {boolean} header/footer が存在して折り畳みを行ったか
 */
function foldHeaderFooter(lines, d) {
  const { header, footer } = findHeaderFooter(lines, d.line, d.endLine);
  if (!header && !footer) return false;

  const newLines = [d.raw];

  if (header) {
    newLines.push("<!-- {{header}}");
    newLines.push(...header.content);
    newLines.push("{{/header}} -->");
  }

  if (footer) {
    newLines.push("<!-- {{footer}}");
    newLines.push(...footer.content);
    newLines.push("{{/footer}} -->");
  }

  newLines.push(lines[d.endLine]);
  lines.splice(d.line, d.endLine - d.line + 1, ...newLines);
  return true;
}

/**
 * header/footer 付き data ブロックの内容を置換する。
 * header/footer がなければ従来の replaceBlockDirective にフォールバック。
 *
 * @param {string[]} lines
 * @param {DataDirective} d
 * @param {string} rendered - 解決済みデータ
 */
function replaceWithHeaderFooter(lines, d, rendered) {
  const { header, footer } = findHeaderFooter(lines, d.line, d.endLine);
  if (!header && !footer) {
    replaceBlockDirective(lines, d, rendered);
    return;
  }

  const newLines = [d.raw];

  if (header) {
    newLines.push(lines[header.start]);  // <!-- {{header}} -->
    newLines.push(...header.content);
    newLines.push(lines[header.end]);    // <!-- {{/header}} -->
  }

  newLines.push(rendered);

  if (footer) {
    newLines.push(lines[footer.start]);  // <!-- {{footer}} -->
    newLines.push(...footer.content);
    newLines.push(lines[footer.end]);    // <!-- {{/footer}} -->
  }

  newLines.push(lines[d.endLine]);       // <!-- {{/data}} -->
  lines.splice(d.line, d.endLine - d.line + 1, ...newLines);
}

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
 * @param {function} resolveFn - (preset, source, method, labels) => rendered string | null
 * @param {Object} [opts]
 * @param {function} [opts.onResolve] - (directive, rendered) => void — 解決時コールバック
 * @param {function} [opts.onSkip] - (directive) => void — data 以外のディレクティブ時コールバック
 * @param {function} [opts.onUnresolved] - (directive) => void — data ディレクティブが null 返却時コールバック
 * @returns {{ text: string, replaced: number }}
 */
export function resolveDataDirectives(text, resolveFn, opts) {
  const { onResolve, onSkip, onUnresolved } = opts || {};
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

    const rendered = resolveFn(d.preset, d.source, d.method, d.labels);
    if (rendered === null || rendered === undefined) {
      if (onUnresolved) onUnresolved(d);
      // I1: fold header/footer when data is null
      if (!d.inline && d.endLine >= 0) {
        foldHeaderFooter(lines, d);
      }
      continue;
    }

    if (onResolve) onResolve(d, rendered);

    if (d.inline) {
      const openTag = d.raw.match(/<!--\s*\{\{data:\s*[\w-]+\.[\w.-]+\.[\w-]+(?:\("[^"]*"\))?\s*\}\}\s*-->/)[0];
      const endTag = "<!-- {{/data}} -->";
      lines[d.line] = lines[d.line].replace(d.raw, `${openTag}${rendered}${endTag}`);
      replaced++;
    } else if (d.endLine >= 0) {
      replaceWithHeaderFooter(lines, d, rendered);
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

/**
 * sdd-forge/engine/template-merger.js
 *
 * テンプレート継承エンジン。
 * ディレクトリ階層をもとに base → leaf の継承チェーンを構築し、
 * @block / @endblock / @extends ディレクティブでブロック単位のマージを行う。
 */

import fs from "fs";
import path from "path";
import { parseBlocks } from "./directive-parser.js";
import { presetByLeaf } from "../../lib/presets.js";
import { callAgent, resolveAgent } from "../../lib/agent.js";

// ---------------------------------------------------------------------------
// 継承チェーン解決
// ---------------------------------------------------------------------------

/**
 * type パス（例: "webapp/cakephp2"）を継承チェーンに展開する。
 * base → arch → leaf preset → project-local の順でテンプレートディレクトリを返す。
 *
 * @param {string} typePath - 型パス（例: "webapp/cakephp2"）
 * @param {string} lang - ロケール（例: "ja"）
 * @param {string|null} [projectLocalDir] - プロジェクトローカルテンプレート（例: .sdd-forge/templates/ja/docs/）
 * @returns {string[]} 継承チェーン（絶対パスの配列）
 */
export function resolveChain(typePath, lang, projectLocalDir) {
  const segments = typePath.split("/").filter(Boolean);
  const chain = [];

  // base 層
  const base = presetByLeaf("base");
  if (base) chain.push(path.join(base.dir, "templates", lang));

  // arch 層（例: "webapp"）
  if (segments.length >= 1 && segments[0] !== "base") {
    const arch = presetByLeaf(segments[0]);
    if (arch) chain.push(path.join(arch.dir, "templates", lang));
  }

  // leaf preset 層（例: "cakephp2"）
  if (segments.length >= 2) {
    const leaf = presetByLeaf(segments[segments.length - 1]);
    if (leaf?.dir) chain.push(path.join(leaf.dir, "templates", lang));
  }

  // ディレクトリ存在検証（組み込み層のみ）
  const missing = chain.filter((dir) => !fs.existsSync(dir));
  if (missing.length > 0 && missing.length === chain.length) {
    throw new Error(`Template directory not found: ${missing[0]}`);
  }
  // Remove missing directories from chain (fallback handles them)
  const validChain = chain.filter((dir) => fs.existsSync(dir));

  // プロジェクトローカル層（存在する場合のみ追加）
  if (projectLocalDir && fs.existsSync(projectLocalDir)) {
    validChain.push(projectLocalDir);
  }

  // 欠落フラグ: 呼び出し元が部分チェーンを検知できるようにする
  validChain.incomplete = missing.length > 0;

  return validChain;
}

/**
 * 指定言語のテンプレートチェーンを構築する。テンプレートが見つからない場合、
 * fallbackLangs の順で他言語テンプレートを探し、AI 翻訳して一時ディレクトリに展開する。
 *
 * @param {string} typePath - 型パス
 * @param {string} lang - ターゲット言語
 * @param {string|null} projectLocalDir - プロジェクトローカルテンプレート
 * @param {Object} [opts]
 * @param {string[]} [opts.fallbackLangs] - フォールバック言語リスト
 * @param {Object} [opts.agent] - AI エージェント設定（翻訳用）
 * @param {string} [opts.root] - プロジェクトルート
 * @returns {string[]} 継承チェーン
 */
export function resolveChainWithFallback(typePath, lang, projectLocalDir, opts) {
  let primaryChain;
  try {
    primaryChain = resolveChain(typePath, lang, projectLocalDir);
    if (primaryChain.length > 0 && !primaryChain.incomplete) return primaryChain;
  } catch (_) {
    // fall through to fallback
  }

  const { fallbackLangs, agent, root } = opts || {};
  if (!fallbackLangs || fallbackLangs.length === 0) {
    // No fallback configured — return partial chain if available
    if (primaryChain && primaryChain.length > 0) return primaryChain;
    throw new Error(`No templates found for language '${lang}' and no fallback languages configured`);
  }

  // Try each fallback language — translate the FULL chain from fallback
  for (const fbLang of fallbackLangs) {
    if (fbLang === lang) continue;
    try {
      const fbChain = resolveChain(typePath, fbLang, null);
      if (fbChain.length === 0 || fbChain.incomplete) continue;

      if (!agent) {
        // No agent available — use source language templates as-is
        return fbChain;
      }

      // Translate templates on-the-fly to a temp directory
      const tmpDir = path.join(root || process.cwd(), ".sdd-forge", "tmp", `templates-${lang}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      const chapters = collectChapters(fbChain);
      for (const ch of chapters) {
        const translated = translateTemplate(ch.content, fbLang, lang, agent, root);
        fs.writeFileSync(path.join(tmpDir, ch.fileName), translated, "utf8");
      }

      // Also translate README.md if exists
      const readmeTpl = resolveReadmeTemplate(fbChain);
      if (readmeTpl) {
        const readmeContent = fs.readFileSync(readmeTpl, "utf8");
        const translated = translateTemplate(readmeContent, fbLang, lang, agent, root);
        fs.writeFileSync(path.join(tmpDir, "README.md"), translated, "utf8");
      }

      // Return chain with just the translated temp dir
      if (projectLocalDir && fs.existsSync(projectLocalDir)) {
        return [tmpDir, projectLocalDir];
      }
      return [tmpDir];
    } catch (_) {
      continue;
    }
  }

  // All fallbacks failed — return partial primary chain if available
  if (primaryChain && primaryChain.length > 0) return primaryChain;
  throw new Error(`No templates found for language '${lang}' in any fallback language`);
}

/**
 * テンプレートを翻訳する。ディレクティブは保持し、Markdown のテキスト部分のみ翻訳する。
 *
 * @param {string} content - テンプレート内容
 * @param {string} fromLang - 元言語
 * @param {string} toLang - ターゲット言語
 * @param {Object} agent - AI エージェント設定
 * @param {string} [root] - プロジェクトルート
 * @returns {string}
 */
function translateTemplate(content, fromLang, toLang, agent, root) {
  const prompt = [
    `Translate the following Markdown template from ${fromLang} to ${toLang}.`,
    "",
    "Rules:",
    "- Preserve ALL directives exactly as-is: {{data: ...}}, {{text: ...}}, {{/data}}, <!-- @block -->, <!-- @endblock -->, <!-- @extends -->",
    "- Translate ONLY: Markdown headings (#), static text, table headers in data directive labels",
    "- For {{text: ...}} directives, translate the prompt text inside them",
    "- Do NOT add or remove any lines",
    "- Output ONLY the translated template, no explanation",
    "",
    "Template:",
    content,
  ].join("\n");

  try {
    return callAgent(agent, prompt, 60000, root);
  } catch (err) {
    // Translation failed — return original
    return content;
  }
}

// ---------------------------------------------------------------------------
// ブロックマージ
// ---------------------------------------------------------------------------

/**
 * 親テンプレートと子テンプレートをブロック単位でマージする。
 *
 * @param {string} parentText - 親テンプレートの全文
 * @param {string} childText - 子テンプレートの全文
 * @returns {string} マージ結果
 */
function mergeTexts(parentText, childText) {
  const parent = parseBlocks(parentText);
  const child = parseBlocks(childText);

  // 子が @extends を持たない → 完全置換
  if (!child.extends) {
    return childText;
  }

  // 子が @extends を持つ → ブロック単位で親をマージ
  const resultLines = [];

  // preamble: 親を使用（子のpreambleは @extends 行のみのことが多い）
  resultLines.push(...parent.preamble);

  // ブロック: 親のブロック順に走査し、子のオーバーライドを適用
  for (const [name, parentBlock] of parent.blocks) {
    const childBlock = child.blocks.get(name);

    resultLines.push(`<!-- @block: ${name} -->`);

    if (!childBlock) {
      // 子にブロックなし → 親をそのまま使用
      resultLines.push(...parentBlock.content);
    } else {
      // 子にブロックあり → 子で完全置換
      resultLines.push(...childBlock.content);
    }

    resultLines.push("<!-- @endblock -->");
  }

  // 子にのみ存在するブロック（親にないもの）を追加
  for (const [name, childBlock] of child.blocks) {
    if (!parent.blocks.has(name)) {
      resultLines.push(`<!-- @block: ${name} -->`);
      resultLines.push(...childBlock.content);
      resultLines.push("<!-- @endblock -->");
    }
  }

  // postamble: 親を使用
  resultLines.push(...parent.postamble);

  return resultLines.join("\n");
}

// ---------------------------------------------------------------------------
// ファイルマージ
// ---------------------------------------------------------------------------

/**
 * 継承チェーンに沿ってテンプレートファイルをマージする。
 *
 * @param {string} fileName - テンプレートファイル名（例: "01_overview.md"）
 * @param {string[]} chain - 継承チェーン（絶対パスの配列）
 * @returns {string|null} マージ結果。空ファイルの場合は null（削除マーク）。
 */
export function mergeFile(fileName, chain) {
  let result = null;

  for (const dir of chain) {
    const filePath = path.join(dir, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");

    // 空ファイル → 削除マーク
    if (content.trim() === "") {
      return null;
    }

    if (result === null) {
      // 最初のファイル → ベース
      result = content;
    } else {
      // 後続 → マージ
      result = mergeTexts(result, content);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// 章収集
// ---------------------------------------------------------------------------

/**
 * 継承チェーン全体から章ファイル名を収集・マージし、
 * ソート済みリストを返す。
 * 空ファイル（削除マーク）はスキップ。
 *
 * @param {string[]} chain - 継承チェーン（絶対パスの配列）
 * @returns {{ fileName: string, content: string }[]}
 */
export function collectChapters(chain) {
  // 全チェーンから章ファイル名を収集
  const allFiles = new Set();
  for (const dir of chain) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => /^\d{2}_.*\.md$/.test(f));
    for (const f of files) allFiles.add(f);
  }

  // ソートしてマージ
  const sorted = [...allFiles].sort();
  const chapters = [];

  for (const fileName of sorted) {
    const content = mergeFile(fileName, chain);
    if (content !== null) {
      chapters.push({ fileName, content });
    }
  }

  return chapters;
}

/**
 * 継承チェーンから README.md テンプレートを解決する。
 * 最も具体的な（リーフに近い）README.md を使用する。
 *
 * @param {string[]} chain - 継承チェーン（絶対パスの配列）
 * @returns {string|null} README テンプレートパス、見つからなければ null
 */
export function resolveReadmeTemplate(chain) {
  // リーフから順に探索
  for (let i = chain.length - 1; i >= 0; i--) {
    const p = path.join(chain[i], "README.md");
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ---------------------------------------------------------------------------
// chapters.json ベースのフィルタリング (Phase 3 準備)
// ---------------------------------------------------------------------------

/**
 * 決定的フィルタ: chapters.json の requires 条件で章をフィルタする。
 * analysis.json の該当セクションが空 or 存在しない → スキップ。
 *
 * @param {{ fileName: string, content: string }[]} chapters
 * @param {string[]} chain - 継承チェーン（絶対パスの配列）
 * @param {Object|null} analysis - analysis.json（null なら全章を含める）
 * @returns {{ fileName: string, content: string }[]}
 */
export function filterChapters(chapters, chain, analysis) {
  if (!analysis) return chapters;

  // 全チェーンの chapters.json をマージ（後勝ち）
  const requirements = {};
  for (const dir of chain) {
    const chaptersJsonPath = path.join(dir, "chapters.json");
    if (!fs.existsSync(chaptersJsonPath)) continue;
    const data = JSON.parse(fs.readFileSync(chaptersJsonPath, "utf8"));
    Object.assign(requirements, data);
  }

  if (Object.keys(requirements).length === 0) return chapters;

  return chapters.filter((ch) => {
    const req = requirements[ch.fileName];
    if (!req || !Array.isArray(req.requires)) return true;

    // requires の全条件を満たすか
    return req.requires.every((key) => {
      const section = analysis[key];
      if (!section) return false;
      // 配列の場合は長さチェック
      if (Array.isArray(section)) return section.length > 0;
      // オブジェクトの場合はメインリストをチェック
      if (section[key] && Array.isArray(section[key])) return section[key].length > 0;
      // summary のチェック
      if (section.summary && section.summary.total !== undefined) return section.summary.total > 0;
      return true;
    });
  });
}

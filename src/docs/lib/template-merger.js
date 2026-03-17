/**
 * sdd-forge/engine/template-merger.js
 *
 * テンプレート解決エンジン（ボトムアップ方式）。
 *
 * ディレクトリ階層を「最も具体的な層（project-local）→ 最も汎用的な層（base）」の
 * 順で探索し、各ファイルの正規パスと処理方法（そのまま使用 / 翻訳して使用）を決定する。
 *
 * @block / @endblock / @extends ディレクティブによるブロック単位マージにも対応。
 */

import fs from "fs";
import path from "path";
import { parseBlocks } from "./directive-parser.js";
import { presetByLeaf, resolveChainSafe, resolveLangPreset } from "../../lib/presets.js";
import { callAgent } from "../../lib/agent.js";

const SPECIAL_FILES = new Set(["README.md", "AGENTS.sdd.md"]);

/** Resolve the lang-axis preset for a type path. */
function getLangAxisPreset(typePath) {
  const leaf = typePath.split("/").pop();
  return resolveLangPreset(leaf);
}

// ---------------------------------------------------------------------------
// レイヤー構築（ボトムアップ: 最も具体的な層から）
// ---------------------------------------------------------------------------

/**
 * type パスと言語からテンプレートレイヤーを構築する。
 * 優先度の高い順（project-local → leaf → arch → base）で返す。
 *
 * @param {string} typePath - 型パス（例: "webapp/cakephp2"）
 * @param {string} lang - ロケール（例: "ja"）
 * @param {string|null} [projectLocalDir] - プロジェクトローカルテンプレートディレクトリ
 * @returns {string[]} レイヤーディレクトリ配列（優先度高い順）
 */
export function buildLayers(typePath, lang, projectLocalDir) {
  const layers = [];

  // 1. project-local（最高優先）
  if (projectLocalDir && fs.existsSync(projectLocalDir)) {
    layers.push(projectLocalDir);
  }

  // 2. parent チェーンを leaf → root の順で追加（優先度高い順）
  const chain = resolveChainSafe(typePath);

  // chain は root → leaf の順なので、逆順（leaf → root）で追加
  for (let i = chain.length - 1; i >= 0; i--) {
    const dir = path.join(chain[i].dir, "templates", lang);
    if (fs.existsSync(dir)) layers.push(dir);
  }

  // 3. lang 層のテンプレートディレクトリ（parent チェーンの後、base の前）
  const langPreset = getLangAxisPreset(typePath);
  if (langPreset) {
    const dir = path.join(langPreset.dir, "templates", lang);
    if (fs.existsSync(dir)) layers.push(dir);
  }

  return layers;
}

// ---------------------------------------------------------------------------
// 単一ファイル解決（ボトムアップ）
// ---------------------------------------------------------------------------

/**
 * 1つのファイルをボトムアップで解決する。
 * 優先度の高い層から順に探索し、@extends がなければそこで確定。
 * @extends がある場合は上位層の親を探し続ける。
 *
 * @param {string} fileName - テンプレートファイル名（例: "overview.md"）
 * @param {string[]} layers - レイヤーディレクトリ配列（優先度高い順）
 * @returns {{ path: string, content: string, extends: boolean }[]|null}
 *   ソース配列（優先度高い順）。削除マークなら null。ファイル未発見なら null。
 */
function resolveOneFile(fileName, layers) {
  const sources = [];

  for (const dir of layers) {
    const filePath = path.join(dir, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");

    // 空ファイル → 削除マーク
    if (content.trim() === "") return null;

    const parsed = parseBlocks(content);
    sources.push({ path: filePath, content, extends: parsed.extends });

    // @extends なし → 親不要、ここで確定
    if (!parsed.extends) break;
  }

  return sources.length > 0 ? sources : null;
}

// ---------------------------------------------------------------------------
// ソースマージ
// ---------------------------------------------------------------------------

/**
 * 解決済みソース配列をマージする。
 * ソースは優先度高い順（project-local → base）で並んでいるため、
 * 逆順（base → project-local）で mergeTexts を適用する。
 *
 * @param {{ path: string, content: string, extends: boolean }[]} sources
 * @returns {string|null} マージ結果
 */
export function mergeResolved(sources) {
  if (!sources || sources.length === 0) return null;
  if (sources.length === 1) return sources[0].content;

  // base（末尾）から開始し、子を順に被せる
  let result = sources[sources.length - 1].content;
  for (let i = sources.length - 2; i >= 0; i--) {
    result = mergeTexts(result, sources[i].content);
  }
  return result;
}

// ---------------------------------------------------------------------------
// テンプレート解決（メインエントリポイント）
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} FileResolution
 * @property {string} fileName - テンプレートファイル名（例: "overview.md"）
 * @property {{ path: string, content: string, extends: boolean }[]} sources - ソース配列
 * @property {"use"|"translate"} action - 処理方法
 * @property {string} [from] - 翻訳元言語（action === "translate" の場合）
 * @property {string} [to] - 翻訳先言語（action === "translate" の場合）
 */

/**
 * 指定タイプ・言語の全テンプレートファイルを解決する。
 * 各ファイルについて正規パスと処理方法（use / translate）を決定する。
 *
 * @param {string} typePath - 型パス（例: "cli/node-cli"）
 * @param {string} lang - ターゲット言語
 * @param {Object} [opts]
 * @param {string|null} [opts.projectLocalDir] - プロジェクトローカルテンプレートディレクトリ
 * @param {string[]} [opts.fallbackLangs] - フォールバック言語リスト
 * @param {string[]} [opts.chaptersOrder] - preset.json の chapters 順序配列
 * @returns {FileResolution[]}
 */
export function resolveTemplates(typePath, lang, opts = {}) {
  const { projectLocalDir, fallbackLangs, chaptersOrder } = opts;

  // ターゲット言語のレイヤー
  const layers = buildLayers(typePath, lang, projectLocalDir);

  // フォールバック言語のレイヤーセット
  const fallbackSets = (fallbackLangs || [])
    .filter((l) => l !== lang)
    .map((fbLang) => ({
      lang: fbLang,
      layers: buildLayers(
        typePath,
        fbLang,
        deriveFallbackProjectLocalDir(projectLocalDir, fbLang),
      ),
    }));

  // 解決対象ファイル名を収集
  const fileNames = discoverFileNames(layers, fallbackSets, chaptersOrder);

  // 各ファイルを解決
  const resolutions = [];
  for (const fileName of fileNames) {
    const resolution = resolveOneFileWithFallback(
      fileName,
      lang,
      layers,
      fallbackSets,
    );
    if (resolution) resolutions.push(resolution);
  }

  return resolutions;
}

/**
 * 1つのファイルをターゲット言語 → フォールバック言語の順で解決する。
 */
function resolveOneFileWithFallback(fileName, lang, layers, fallbackSets) {
  // ターゲット言語で解決を試みる
  const sources = resolveOneFile(fileName, layers);
  if (sources) {
    return { fileName, sources, action: "use" };
  }

  // フォールバック言語で解決を試みる
  for (const fb of fallbackSets) {
    const fbSources = resolveOneFile(fileName, fb.layers);
    if (fbSources) {
      return {
        fileName,
        sources: fbSources,
        action: "translate",
        from: fb.lang,
        to: lang,
      };
    }
  }

  return null;
}

/**
 * フォールバック言語のプロジェクトローカルディレクトリを導出する。
 */
function deriveFallbackProjectLocalDir(projectLocalDir, fbLang) {
  if (!projectLocalDir) return null;
  return projectLocalDir.replace(/\/[^/]+\/docs\/?$/, `/${fbLang}/docs`);
}

/**
 * 解決対象のファイル名一覧を収集する。
 * chaptersOrder がある場合はそれに従い、なければ全レイヤーをスキャンする。
 */
function discoverFileNames(layers, fallbackSets, chaptersOrder) {
  if (chaptersOrder && chaptersOrder.length > 0) {
    return [...chaptersOrder, "README.md"];
  }

  // 全レイヤーをスキャンして .md ファイルを収集
  const allFiles = new Set();
  const allLayers = [...layers];
  for (const fb of fallbackSets) {
    allLayers.push(...fb.layers);
  }

  for (const dir of allLayers) {
    if (!fs.existsSync(dir)) continue;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md") && !SPECIAL_FILES.has(f));
    for (const f of files) allFiles.add(f);
  }

  const sorted = [...allFiles].sort();
  // README.md は常に末尾に追加
  sorted.push("README.md");
  return sorted;
}

// ---------------------------------------------------------------------------
// 章順序解決
// ---------------------------------------------------------------------------

/**
 * type パスから章の順序を解決する。
 * configChapters が指定されている場合はそれを最優先（プリセットを完全上書き）。
 * それ以外は継承チェーン（base → arch → leaf）で探索し、
 * 最も具体的な（リーフに近い）preset の chapters を使用する。
 *
 * @param {string} typePath - 型パス（例: "webapp/cakephp2"）
 * @param {string[]} [configChapters] - config.json の chapters 配列（最優先）
 * @returns {string[]} 章ファイル名の順序配列
 */
export function resolveChaptersOrder(typePath, configChapters) {
  // config.json の chapters が定義されていればプリセットを完全上書き
  if (configChapters?.length) return configChapters;

  const chain = resolveChainSafe(typePath);

  // chain は root → leaf の順。最も具体的な（leaf に近い）chapters を使用
  // lang 層（axis: "lang"）の chapters は上書きではなく union 追加用なのでスキップ
  let chapters = [];
  for (const preset of chain) {
    if (preset.axis === "lang") continue;
    if (preset.chapters?.length) chapters = preset.chapters;
  }

  // lang 層の chapters を union マージ（overview.md の直後に挿入）
  const langPreset = getLangAxisPreset(typePath);
  if (langPreset?.chapters?.length) {
    const existing = new Set(chapters);
    const toAdd = langPreset.chapters.filter((ch) => !existing.has(ch));
    if (toAdd.length > 0) {
      const overviewIdx = chapters.indexOf("overview.md");
      const insertAt = overviewIdx >= 0 ? overviewIdx + 1 : 0;
      chapters = [...chapters.slice(0, insertAt), ...toAdd, ...chapters.slice(insertAt)];
    }
  }

  return chapters;
}

// ---------------------------------------------------------------------------
// テンプレート翻訳ユーティリティ
// ---------------------------------------------------------------------------

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
export function translateTemplate(content, fromLang, toLang, agent, root) {
  const prompt = [
    `Translate the following Markdown template from ${fromLang} to ${toLang}.`,
    "",
    "Rules:",
    '- Preserve ALL directives exactly as-is: {{data: ...}}, {{text: ...}}, {{/data}}, <!-- @block -->, <!-- @endblock -->, <!-- @extends -->',
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
// ブロックマージ（内部）
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

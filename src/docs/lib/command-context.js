/**
 * sdd-forge/docs/lib/command-context.js
 *
 * コマンド共通のコンテキスト解決。
 * 全コマンドが同じ方法で root / lang / docsDir / type / config を取得する。
 */

import fs from "fs";
import path from "path";
import { repoRoot, sourceRoot } from "../../lib/cli.js";
import { loadJsonFile, sddConfigPath, sddOutputDir, DEFAULT_LANG } from "../../lib/config.js";
import { resolveType, validateConfig } from "../../lib/types.js";
import { resolveAgent } from "../../lib/agent.js";
import { translate } from "../../lib/i18n.js";
import { resolveChaptersOrder } from "./template-merger.js";

/**
 * @typedef {Object} CommandContext
 * @property {string} root - 作業ルート（SDD_WORK_ROOT or git root）
 * @property {string} srcRoot - ソースルート（SDD_SOURCE_ROOT or root）
 * @property {Object} config - .sdd-forge/config.json の内容
 * @property {string} lang - 操作言語（config.lang）
 * @property {string} outputLang - 出力デフォルト言語（config.output.default）
 * @property {string} type - 解決済みプロジェクトタイプ
 * @property {string} docsDir - docs ディレクトリの絶対パス
 * @property {Object|null} agent - AI エージェント設定
 * @property {Function} t - i18n 翻訳関数（domain: messages）
 */

/**
 * CLI 引数と設定ファイルからコマンドコンテキストを解決する。
 *
 * @param {Object} [cli] - parseArgs() の結果（オプション）
 * @param {Object} [overrides] - 強制上書き値
 * @param {string} [overrides.root] - 作業ルート
 * @param {string} [overrides.lang] - 言語
 * @param {string} [overrides.docsDir] - docs ディレクトリ
 * @param {string} [overrides.type] - プロジェクトタイプ
 * @param {string} [overrides.commandId] - COMMAND_ID for per-command agent resolution
 * @returns {CommandContext}
 */
export function resolveCommandContext(cli, overrides) {
  const o = overrides || {};
  const root = o.root || repoRoot();
  const srcRoot = o.srcRoot || sourceRoot();

  // config 読み込み（失敗時は空オブジェクト — setup/help 等で config がないケース）
  let config;
  try {
    config = validateConfig(loadJsonFile(sddConfigPath(root)));
  } catch (_) {
    config = {};
  }

  const lang = o.lang || cli?.lang || config.lang || DEFAULT_LANG;
  const outputLang = o.outputLang || cli?.lang || config.output?.default || lang;
  const rawType = o.type || cli?.type || config.type || "";
  const type = rawType ? resolveType(rawType) : "";

  const docsDir = o.docsDir
    ? path.resolve(root, o.docsDir)
    : cli?.docsDir
      ? path.resolve(root, cli.docsDir)
      : path.join(root, "docs");

  const commandId = o.commandId || undefined;
  const agent = resolveAgent(config, commandId);

  const t = translate();

  return {
    root,
    srcRoot,
    config,
    lang,
    outputLang,
    type,
    docsDir,
    agent,
    commandId,
    t,
  };
}

/**
 * .sdd-forge/output/ 配下の JSON ファイルを読み込む。
 *
 * @param {string} root - プロジェクトルート
 * @param {string} fileName - ファイル名（例: "analysis.json"）
 * @returns {Object|null} パース結果、見つからなければ null
 */
function loadOutputJson(root, fileName) {
  const filePath = path.join(sddOutputDir(root), fileName);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_) {
    return null;
  }
}

/**
 * analysis.json を読み込む。
 *
 * @param {string} root - プロジェクトルート
 * @returns {Object|null} 解析データ、見つからなければ null
 */
export function loadAnalysisData(root) {
  return loadOutputJson(root, "analysis.json");
}

/**
 * analysis.json を読み込む。loadAnalysisData のエイリアス。
 *
 * @param {string} root - プロジェクトルート
 * @returns {Object|null}
 */
export function loadFullAnalysis(root) {
  return loadOutputJson(root, "analysis.json");
}

/**
 * docs ディレクトリから章ファイル一覧を取得する。
 * config.chapters > preset の chapters 順で返す。
 * フォールバック: *.md をアルファベット順（README.md, AGENTS.sdd.md 除外）。
 *
 * @param {string} docsDir - docs ディレクトリの絶対パス
 * @param {Object} [options]
 * @param {string} [options.type] - プロジェクトタイプ（例: "cli/node-cli"）
 * @param {string[]} [options.configChapters] - config.json の chapters 配列（最優先）
 * @returns {string[]} ファイル名の配列（順序付き）
 */
export function getChapterFiles(docsDir, options) {
  if (!fs.existsSync(docsDir)) return [];

  const type = options?.type;
  const configChapters = options?.configChapters;
  const EXCLUDE = new Set(["README.md", "AGENTS.sdd.md"]);

  if (type || configChapters?.length) {
    const chapters = resolveChaptersOrder(type || "base", configChapters);
    if (chapters.length > 0) {
      const existing = chapters.filter((f) => fs.existsSync(path.join(docsDir, f)));
      if (existing.length > 0) return existing;
    }
  }

  // Fallback: all *.md files alphabetically (excluding special files)
  return fs
    .readdirSync(docsDir)
    .filter((f) => f.endsWith(".md") && !EXCLUDE.has(f))
    .sort();
}

/**
 * ファイルを読み込む。存在しなければ空文字列を返す。
 *
 * @param {string} p - ファイルパス
 * @returns {string}
 */
export function readText(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

/**
 * AI レスポンスから先頭のプリアンブル（前置き）を除去する。
 * 最初の # 見出し行をコンテンツ開始位置とする。
 *
 * @param {string} text - AI レスポンステキスト
 * @param {number} [maxScanLines=10] - スキャンする最大行数
 * @returns {string}
 */
export function stripResponsePreamble(text, maxScanLines = 10) {
  const lines = text.split("\n");
  let startIdx = 0;
  for (let i = 0; i < Math.min(maxScanLines, lines.length); i++) {
    if (lines[i].startsWith("#")) { startIdx = i; break; }
  }
  return lines.slice(startIdx).join("\n").trimEnd() + "\n";
}

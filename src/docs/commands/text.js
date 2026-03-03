#!/usr/bin/env node
/**
 * sdd-forge/engine/tfill.js
 *
 * @text ディレクティブ専用プロセッサ。
 * テンプレート内の @text を LLM エージェント（claude / codex）で解決し、
 * ディレクティブ直後に説明文を挿入する。
 *
 * Usage:
 *   node sdd-forge/engine/tfill.js --agent claude [--dry-run] [--timeout 60000] [--id <id>]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseDirectives } from "../lib/directive-parser.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig, resolveProjectContext } from "../../lib/config.js";
import { createLogger } from "../../lib/progress.js";
import { callAgent as callAgentBase, callAgentAsync as callAgentAsyncBase } from "../../lib/agent.js";

const logger = createLogger("text");

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_TIMEOUT_MS = 180000;

// ---------------------------------------------------------------------------
// 設定読み込み
// ---------------------------------------------------------------------------

function loadAgentConfig(cfg, agentName) {
  const providerKey = agentName || cfg.defaultAgent;
  const provider = cfg.providers?.[providerKey];
  if (!provider) {
    throw new Error(`Unknown agent provider: ${providerKey}. Available: ${Object.keys(cfg.providers || {}).join(", ")}`);
  }
  return provider;
}

/**
 * config の textFill.preamblePatterns を RegExp 配列に変換する。
 */
function loadPreamblePatterns(cfg) {
  const entries = cfg.textFill?.preamblePatterns;
  if (!Array.isArray(entries) || entries.length === 0) return [];
  return entries.map((e) => new RegExp(e.pattern, e.flags || ""));
}

// ---------------------------------------------------------------------------
// documentStyle → プロンプトヘッダー生成
// ---------------------------------------------------------------------------

const PURPOSE_MAP = {
  ja: {
    "developer-guide": "開発者向けの技術ガイド",
    "user-guide": "利用者向けの操作ガイド",
    "api-reference": "API リファレンス",
  },
  en: {
    "developer-guide": "a developer guide",
    "user-guide": "a user guide",
    "api-reference": "an API reference",
  },
};

const TONE_MAP = {
  ja: {
    polite: "です・ます調で記述すること",
    formal: "だ・である調で記述すること",
    casual: "カジュアルな口語体で記述すること",
  },
  en: {
    polite: "Use a professional and approachable tone",
    formal: "Use a formal, technical tone",
    casual: "Use a casual, conversational tone",
  },
};

/**
 * documentStyle と projectContext からプロンプトヘッダー行を生成する。
 *
 * @param {string} projectContext - プロジェクト概要テキスト
 * @param {import("../lib/types.js").DocumentStyle|undefined} documentStyle
 * @param {string} lang - "ja" | "en"
 * @returns {string[]} ヘッダー行配列
 */
function buildPromptHeader(projectContext, documentStyle, lang) {
  const header = [];
  if (documentStyle) {
    const pMap = PURPOSE_MAP[lang] || PURPOSE_MAP.ja;
    const tMap = TONE_MAP[lang] || TONE_MAP.ja;
    const purposeLabel = pMap[documentStyle.purpose] || documentStyle.purpose;
    if (lang === "en") {
      header.push(`You are writing ${purposeLabel} for a software project.`);
    } else {
      header.push(`あなたはソフトウェアプロジェクトの${purposeLabel}を作成しています。`);
    }
    if (documentStyle.tone) {
      header.push(tMap[documentStyle.tone] || documentStyle.tone);
    }
    if (documentStyle.customInstruction) {
      header.push("", documentStyle.customInstruction);
    }
  } else {
    header.push("あなたはソフトウェアプロジェクトのテクニカルドキュメントを作成しています。");
  }
  if (projectContext) {
    header.push("", "## プロジェクト情報", projectContext);
  }
  return header;
}

// ---------------------------------------------------------------------------
// 解析データからファイル別コンテキストを動的に選択
// ---------------------------------------------------------------------------

/**
 * @data カテゴリ名 → analysis.json の必要セクションへのマッピング。
 * ファイル内の @data ディレクティブのカテゴリから、@text に渡す
 * コンテキストデータを自動判定する。
 */
const CATEGORY_TO_SECTIONS = {
  // controllers.*
  controllers:             (a) => ({ controllers: a.controllers }),
  "controllers.deps":      (a) => ({ controllers: a.controllers }),
  "controllers.csv":       (a) => ({ controllers: a.controllers }),
  "controllers.actions":   (a) => ({ titlesGraphMapping: a.extras?.titlesGraphMapping }),
  // tables / models
  tables:                  (a) => ({ models: a.models }),
  "tables.fk":             (a) => ({ models: a.models }),
  "tables.sync":           (a) => ({ models: a.models }),
  "models.logic":          (a) => ({ logicClasses: a.extras?.logicClasses }),
  "models.logic.methods":  (a) => ({ logicClasses: a.extras?.logicClasses }),
  "models.relations":      (a) => ({ models: a.models }),
  "models.er":             (a) => ({ models: a.models }),
  // shells
  shells:                  (a) => ({ shells: a.shells }),
  "shells.deps":           (a) => ({ shells: a.shells }),
  "shells.flow":           (a) => ({ shellDetails: a.extras?.shellDetails }),
  // config
  "config.stack":          ()  => ({}),
  "config.composer":       (a) => ({ composerDeps: a.extras?.composerDeps }),
  "config.assets":         (a) => ({ assets: a.extras?.assets }),
  "config.bootstrap":      (a) => ({ bootstrap: a.extras?.bootstrap }),
  "config.db":             (a) => ({ bootstrap: a.extras?.bootstrap }),
  "config.constants":      (a) => ({ constants: a.extras?.constants }),
  "config.constants.select":(a) => ({ constants: a.extras?.constants }),
  "config.auth":           (a) => ({ appController: a.extras?.appController }),
  "config.acl":            (a) => ({ acl: a.extras?.acl }),
  // views
  "views.helpers":         (a) => ({ helpers: a.extras?.helpers }),
  "views.layouts":         (a) => ({ layouts: a.extras?.layouts }),
  "views.elements":        (a) => ({ elements: a.extras?.elements }),
  "views.components":      (a) => ({ permissionComponent: a.extras?.permissionComponent }),
  // libs
  libs:                    (a) => ({ libraries: a.extras?.libraries }),
  "libs.errors":           (a) => ({ libraries: a.extras?.libraries }),
  "libs.behaviors":        (a) => ({ behaviors: a.extras?.behaviors }),
  "libs.sql":              (a) => ({ sqlFiles: a.extras?.sqlFiles }),
  "libs.appmodel":         (a) => ({ appModel: a.extras?.appModel }),
  // email / tests / docker
  email:                   (a) => ({ emailNotifications: a.extras?.emailNotifications }),
  tests:                   (a) => ({ testStructure: a.extras?.testStructure }),
  docker:                  ()  => ({}),
};

/**
 * ファイル内の全ディレクティブから、@text に必要なコンテキストデータを
 * 動的に収集する。@data のカテゴリ名をキーにして analysis.json の
 * 対応セクションをマージする。
 */
function getAnalysisContext(analysis, directives) {
  if (!analysis) return {};
  const data = {};

  // サマリーは常に含める（章の概要生成等に必要）
  if (analysis.controllers?.summary) data.controllersSummary = analysis.controllers.summary;
  if (analysis.models?.summary) data.modelsSummary = analysis.models.summary;
  if (analysis.shells?.summary) data.shellsSummary = analysis.shells.summary;
  if (analysis.routes?.summary) data.routesSummary = analysis.routes.summary;

  // @data カテゴリから必要なセクションを収集
  const dataFills = directives.filter((d) => d.type === "data");
  for (const d of dataFills) {
    const extractor = CATEGORY_TO_SECTIONS[d.category];
    if (extractor) {
      const section = extractor(analysis);
      for (const [key, value] of Object.entries(section)) {
        if (value != null && !(key in data)) {
          data[key] = value;
        }
      }
    }
  }

  // extras 全キーのサマリーも含める（@text のプロンプトが任意の情報を参照できるように）
  if (analysis.extras) {
    for (const [key, value] of Object.entries(analysis.extras)) {
      if (!(key in data) && value != null) {
        // 大きなオブジェクトはサマリー化
        if (Array.isArray(value)) {
          data[key] = { _count: value.length, _sample: value.slice(0, 3) };
        } else if (typeof value === "object") {
          data[key] = value;
        }
      }
    }
  }

  return data;
}

// ---------------------------------------------------------------------------
// プロンプト構築
// ---------------------------------------------------------------------------

/**
 * ディレクティブの params から出力ルール文字列を生成する。
 * @param {Object} params - { maxLines?: number, maxChars?: number }
 * @returns {string} 出力ルール文字列
 */
function formatLimitRule(params) {
  const parts = [];
  if (params?.maxLines) {
    parts.push(`${params.maxLines}行以内`);
  }
  if (params?.maxChars) {
    parts.push(`${params.maxChars}文字以内`);
  }
  if (parts.length > 0) {
    return `簡潔かつ正確に（${parts.join("、")}）`;
  }
  return "簡潔かつ正確に（3〜15行程度）";
}

/**
 * システムプロンプトを構築する。
 * documentStyle + projectContext + 共通出力ルールを含む。
 * per-directive / batch 両モードで共有し、provider のプロンプトキャッシュを活用する。
 *
 * @param {string} projectContext
 * @param {import("../lib/types.js").DocumentStyle|undefined} documentStyle
 * @param {string} lang
 * @returns {string}
 */
function buildTextSystemPrompt(projectContext, documentStyle, lang) {
  const header = buildPromptHeader(projectContext, documentStyle, lang);
  return [
    ...header,
    "",
    "以下の指示に従い、ドキュメントに挿入するマークダウンテキストを生成してください。",
    "",
    "## 出力ルール（厳守）",
    "- 本文のマークダウンテキストのみを出力すること",
    "- 前置き・メタコメンタリーは絶対に含めないこと（例: 「以下に生成します」「Based on the analysis data」「Here is the generated text」等は禁止）",
    "- 水平線（---）を装飾目的で使わないこと",
    "- コードブロック（```）で全体を囲まないこと",
    "- セクション見出し（#）は含めない（挿入先に既にある）",
    "- 解析データに基づく事実のみ記述（推測は避ける）",
    "- 1行目から本文を開始すること（空行や導入文で始めない）",
  ].join("\n");
}

function buildPrompt(directive, fileName, lines) {
  const directiveLine = directive.line;

  // ±20行のコンテキストを抽出
  const contextStart = Math.max(0, directiveLine - 20);
  const contextEnd = Math.min(lines.length, directiveLine + 21);
  const surroundingLines = lines.slice(contextStart, contextEnd).join("\n");

  return [
    "## 指示",
    directive.prompt,
    "",
    `- ${formatLimitRule(directive.params)}`,
    "",
    `## 挿入先コンテキスト（${fileName}）`,
    surroundingLines,
  ].join("\n");
}

/**
 * 解析データをシステムプロンプトに付与する。
 * 同一ファイル内の複数ディレクティブで system prompt を共有し、
 * API のプロンプトキャッシュを活用する。
 */
function buildFileSystemPrompt(baseSystemPrompt, contextData) {
  if (!contextData || Object.keys(contextData).length === 0) {
    return baseSystemPrompt;
  }
  const contextJson = JSON.stringify(contextData, null, 2);
  const truncatedJson = contextJson.length > 8000
    ? contextJson.slice(0, 8000) + "\n... (truncated)"
    : contextJson;
  return baseSystemPrompt + "\n\n## ソースコード解析データ\n" + truncatedJson;
}

// ---------------------------------------------------------------------------
// バッチモード：ファイル単位で全ディレクティブを1回の LLM 呼び出しで処理
// ---------------------------------------------------------------------------

/**
 * テンプレートファイルの @text ディレクティブ後にある既存生成コンテンツを
 * 除去してクリーンなテンプレート状態に戻す。
 * processTemplate の endLine 計算と同じ境界ロジックを使用する。
 */
function stripFillContent(text) {
  const lines = text.split("\n");
  const result = [];
  let i = 0;
  while (i < lines.length) {
    result.push(lines[i]);
    if (/^<!--\s*@text\s*(?:\[[^\]]*\])?\s*:/.test(lines[i].trim())) {
      i++;
      while (i < lines.length) {
        const ln = lines[i].trim();
        if (ln.startsWith("#") || ln.startsWith("<!-- @")) break;
        if (ln === "" && i + 1 < lines.length && lines[i + 1].trim() === "") break;
        if (ln === "" && i + 1 < lines.length && lines[i + 1].trim().startsWith("#")) break;
        if (ln === "" && i + 1 < lines.length && lines[i + 1].trim().startsWith("<!-- @")) break;
        i++;
      }
    } else {
      i++;
    }
  }
  return result.join("\n");
}

/**
 * バッチ結果のファイルで埋められたディレクティブ数をカウントする。
 * ディレクティブ行の次の非空行が ## / <!-- @ でなければ filled と判定する。
 */
function countFilledInBatch(fileText) {
  const lines = fileText.split("\n");
  let filled = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^<!--\s*@text\s*(?:\[[^\]]*\])?\s*:/.test(lines[i].trim())) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length &&
          !lines[j].trim().startsWith("## ") &&
          !lines[j].trim().startsWith("<!-- @")) {
        filled++;
      }
    }
  }
  return filled;
}

/**
 * ファイル全体を1つのプロンプトにまとめるバッチプロンプトを構築する。
 * ±20行ウィンドウ・解析データは不要（ファイル全体が文脈になる）。
 */
function buildBatchPrompt(fileName, text, textFills) {
  // ディレクティブごとの個別制限ルールがあれば列挙
  const perDirectiveRules = [];
  for (const d of textFills) {
    if (d.params && (d.params.maxLines || d.params.maxChars)) {
      perDirectiveRules.push(`- 「${d.prompt.slice(0, 40)}…」→ ${formatLimitRule(d.params)}`);
    }
  }
  const defaultRule = perDirectiveRules.length === textFills.length
    ? "" // 全ディレクティブに個別指定があればデフォルト不要
    : "- 個別制限のないディレクティブは3〜15行程度の本文を生成すること";

  return [
    `以下の ${fileName} にある <!-- @text: 指示 --> ディレクティブをすべて埋めてください。`,
    "",
    "## 出力ルール（厳守）",
    "- ファイルの内容全体（未変更部分も含む）をそのまま出力すること",
    "- <!-- @text: ... --> ディレクティブ行は削除せずそのまま残すこと",
    "- 各ディレクティブ行の直後に空行を挟んで本文を挿入すること",
    "- セクション見出し（#, ##, ###）は追加・変更・削除しないこと",
    "- 前置き・解説・メタコメンタリーを絶対に含めないこと",
    "- ファイルの最初の行（# で始まる見出し）から出力を開始すること",
    ...(defaultRule ? [defaultRule] : []),
    ...perDirectiveRules,
    "- 水平線（---）を装飾目的で使わないこと",
    "",
    `## ${fileName}`,
    "",
    text,
  ].join("\n");
}

/**
 * ファイル内のすべての @text ディレクティブを1回の LLM 呼び出しで処理する。
 * 既存の生成済みコンテンツを stripFillContent で除去してからプロンプトを組み立てる。
 *
 * @returns {{ text: string, filled: number, skipped: number }}
 */
async function processTemplateFileBatch(text, analysis, fileName, agent, timeoutMs, cwd, dryRun, _preamblePatterns, systemPrompt) {
  const directives = parseDirectives(text);
  const textFills = directives.filter((d) => d.type === "text");

  if (textFills.length === 0) return { text, filled: 0, skipped: 0 };

  const cleanText = stripFillContent(text);
  const prompt = buildBatchPrompt(fileName, cleanText, textFills);

  if (dryRun) {
    console.log(`[text] DRY-RUN batch ${fileName}: ${textFills.length} directive(s) → 1 call (${prompt.length} chars)`);
    return { text, filled: 0, skipped: textFills.length };
  }

  logger.verbose(`Batch ${fileName}: ${textFills.length} directive(s) → 1 call`);

  // バッチはファイル全体を返すので preamble パターンは使わない
  const result = await callAgentAsync(agent, prompt, timeoutMs, cwd, [], systemPrompt);

  if (!result) {
    throw new Error(`empty batch response for ${fileName}`);
  }

  // ファイル先頭に余分な前置きがあれば除去（最初の # 見出し行を起点にする）
  const resultLines = result.split("\n");
  let startIdx = 0;
  for (let i = 0; i < Math.min(10, resultLines.length); i++) {
    if (resultLines[i].startsWith("#")) { startIdx = i; break; }
  }
  const finalText = resultLines.slice(startIdx).join("\n").trimEnd() + "\n";

  const filled = countFilledInBatch(finalText);
  const skipped = textFills.length - filled;
  logger.verbose(`Batch DONE ${fileName}: ${filled}/${textFills.length} filled`);

  return { text: finalText, filled, skipped };
}

// ---------------------------------------------------------------------------
// エージェント呼び出し
// ---------------------------------------------------------------------------
function callAgent(agent, prompt, timeoutMs, cwd, preamblePatterns, systemPrompt) {
  const result = callAgentBase(agent, prompt, timeoutMs, cwd, { systemPrompt });
  return stripPreamble(result, preamblePatterns);
}

async function callAgentAsync(agent, prompt, timeoutMs, cwd, preamblePatterns, systemPrompt) {
  const result = await callAgentAsyncBase(agent, prompt, timeoutMs, cwd, { systemPrompt });
  return stripPreamble(result, preamblePatterns);
}

/**
 * LLM出力から不要なプレフィックス（メタコメンタリー）を除去する。
 * パターンは config.json の textFill.preamblePatterns から読み込む。
 */
function stripPreamble(text, preamblePatterns) {
  if (!preamblePatterns || preamblePatterns.length === 0) return text;

  const lines = text.split("\n");
  let start = 0;

  // 先頭の空行をスキップ
  while (start < lines.length && lines[start].trim() === "") start++;

  // プレフィックスパターンの検出と除去（最大5行以内）
  const maxPreambleLines = 5;
  let preambleEnd = start;

  for (let i = start; i < Math.min(start + maxPreambleLines, lines.length); i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "") {
      // 空行はプレフィックスの一部かもしれない — 続行
      preambleEnd = i + 1;
      continue;
    }
    const isMetaLine = preamblePatterns.some((p) => p.test(trimmed));
    if (isMetaLine) {
      preambleEnd = i + 1;
      continue;
    }
    // 非メタ行に到達 → ここからが本文
    break;
  }

  if (preambleEnd > start) {
    return lines.slice(preambleEnd).join("\n").trim();
  }
  return text;
}

// ---------------------------------------------------------------------------
// テンプレート処理
// ---------------------------------------------------------------------------

/**
 * 1 ファイルの @text ディレクティブをすべて処理する。
 *
 * @param {string} text        - テンプレート全文
 * @param {Object} analysis    - analysis.json
 * @param {string} fileName    - ファイル名
 * @param {Object} agent       - エージェント設定
 * @param {number} timeoutMs   - タイムアウト
 * @param {string} cwd         - 作業ディレクトリ
 * @param {boolean} dryRun     - dry-run モード
 * @returns {{ text: string, filled: number, skipped: number }}
 */
async function processTemplate(text, analysis, fileName, agent, timeoutMs, cwd, dryRun, preamblePatterns, systemPrompt, filterId, concurrency) {
  const directives = parseDirectives(text);
  let textFills = directives.filter((d) => d.type === "text");
  if (filterId) {
    textFills = textFills.filter((d) => d.params?.id === filterId);
  }

  if (textFills.length === 0) return { text, filled: 0, skipped: 0 };

  const lines = text.split("\n");
  const contextData = getAnalysisContext(analysis, directives);
  // Analysis context をシステムプロンプトに含めることで、
  // 同一ファイル内の複数ディレクティブ間でプロンプトキャッシュを活用する
  const fileSystemPrompt = buildFileSystemPrompt(systemPrompt, contextData);

  if (dryRun) {
    for (const d of textFills) {
      const prompt = buildPrompt(d, fileName, lines);
      console.log(`[text] DRY-RUN ${fileName}:${d.line + 1}: ${d.prompt.slice(0, 80)}`);
      console.log(`[text]   prompt length: ${prompt.length} chars, system prompt: ${fileSystemPrompt.length} chars`);
    }
    return { text, filled: 0, skipped: textFills.length };
  }

  // Phase 1: Build all prompts upfront
  const tasks = textFills.map((d) => ({
    directive: d,
    prompt: buildPrompt(d, fileName, lines),
  }));

  // Phase 2: Parallel LLM calls with concurrency control
  const maxConcurrency = concurrency || DEFAULT_CONCURRENCY;
  const results = new Array(tasks.length);

  await new Promise((resolve) => {
    let running = 0;
    let idx = 0;

    function next() {
      if (idx >= tasks.length && running === 0) {
        resolve();
        return;
      }
      while (running < maxConcurrency && idx < tasks.length) {
        const taskIdx = idx++;
        const { directive: d, prompt } = tasks[taskIdx];
        running++;

        logger.verbose(`Processing ${fileName}:${d.line + 1}: ${d.prompt.slice(0, 60)}...`);

        callAgentAsync(agent, prompt, timeoutMs, cwd, preamblePatterns, fileSystemPrompt)
          .then((generated) => {
            results[taskIdx] = { generated, error: null };
          })
          .catch((err) => {
            results[taskIdx] = { generated: null, error: err };
          })
          .finally(() => {
            running--;
            next();
          });
      }
    }

    next();
  });

  // Phase 3: Apply results in reverse order (line-number shift prevention)
  let filled = 0;
  let skipped = 0;

  for (let i = textFills.length - 1; i >= 0; i--) {
    const d = textFills[i];
    const { generated: rawGenerated, error } = results[i];

    if (error) {
      logger.log(`ERROR calling agent for ${fileName}:${d.line + 1}:`);
      logger.log(error.message);
      skipped++;
      continue;
    }

    if (!rawGenerated) {
      logger.log(`WARN: empty response for ${fileName}:${d.line + 1}`);
      skipped++;
      continue;
    }

    let generated = rawGenerated;

    // maxLines/maxChars によるポスト処理トランケート
    if (d.params?.maxLines) {
      const genLines = generated.split("\n");
      if (genLines.length > d.params.maxLines) {
        logger.log(`WARN: truncating ${fileName}:${d.line + 1} from ${genLines.length} to ${d.params.maxLines} lines`);
        generated = genLines.slice(0, d.params.maxLines).join("\n");
      }
    }
    if (d.params?.maxChars && generated.length > d.params.maxChars) {
      logger.log(`WARN: truncating ${fileName}:${d.line + 1} from ${generated.length} to ${d.params.maxChars} chars`);
      generated = generated.slice(0, d.params.maxChars);
    }

    // 既存出力の除去（ディレクティブ直後〜次のセクション境界まで）
    let endLine = d.line + 1;
    while (endLine < lines.length) {
      const ln = lines[endLine].trim();
      // 次の見出し、ディレクティブ、または空行+見出し/ディレクティブで停止
      if (ln.startsWith("#") || ln.startsWith("<!-- @")) break;
      if (ln === "" && endLine + 1 < lines.length && lines[endLine + 1].trim() === "") break;
      if (ln === "" && endLine + 1 < lines.length && lines[endLine + 1].trim().startsWith("#")) break;
      if (ln === "" && endLine + 1 < lines.length && lines[endLine + 1].trim().startsWith("<!-- @")) break;
      endLine++;
    }

    // ディレクティブ行を残して、既存内容を生成テキストに置換
    const newLines = [d.raw, "", generated, ""];
    lines.splice(d.line, endLine - d.line, ...newLines);
    filled++;
    logger.verbose(`FILLED ${fileName}:${d.line + 1} (${generated.split("\n").length} lines)`);
  }

  let result = lines.join("\n");
  if (!result.endsWith("\n")) result += "\n";
  return { text: result, filled, skipped };
}

// ---------------------------------------------------------------------------
// textFillFromAnalysis (エクスポート用: forge.js などから呼び出し可能)
// ---------------------------------------------------------------------------
/**
 * @param {string} root       - リポジトリルート
 * @param {Object} analysis   - analysis.json データ
 * @param {string} agentName  - エージェント名 (claude, codex)
 * @returns {{ filled: number, skipped: number, files: string[] }}
 */
export async function textFillFromAnalysis(root, analysis, agentName) {
  if (!analysis) return { filled: 0, skipped: 0, files: [] };

  const cfg = loadConfig(root);
  const agent = loadAgentConfig(cfg, agentName);
  const preamblePatterns = loadPreamblePatterns(cfg);
  const projectContext = resolveProjectContext(root);
  const documentStyle = cfg.documentStyle;
  const lang = cfg.lang || "ja";
  const systemPrompt = buildTextSystemPrompt(projectContext, documentStyle, lang);
  const concurrency = Number(cfg.limits?.concurrency || 0) || DEFAULT_CONCURRENCY;
  const docsDir = path.join(root, "docs");
  const docsFiles = fs.readdirSync(docsDir)
    .filter((f) => /^\d{2}_/.test(f) && f.endsWith(".md"))
    .sort();

  const changedFiles = [];
  let totalFilled = 0;
  let totalSkipped = 0;

  // Sequential file processing (processTemplate handles directive-level parallelism)
  const fileResults = [];
  const errors = [];
  for (const file of docsFiles) {
    const filePath = path.join(docsDir, file);
    const original = fs.readFileSync(filePath, "utf8");

    try {
      const result = await processTemplate(original, analysis, file, agent, DEFAULT_TIMEOUT_MS, root, false, preamblePatterns, systemPrompt, undefined, concurrency);
      fileResults.push({ file, filePath, result });
    } catch (err) {
      logger.log(`ERROR processing ${file}:`);
      logger.log(err.message);
      errors.push(file);
      fileResults.push({ file, filePath, result: null });
    }
  }

  for (const { file, filePath, result } of fileResults) {
    if (!result) continue;
    totalFilled += result.filled;
    totalSkipped += result.skipped;

    if (result.filled > 0) {
      fs.writeFileSync(filePath, result.text);
      changedFiles.push(file);
    }
  }

  if (errors.length > 0) {
    logger.log(`${errors.length} file(s) failed: ${errors.join(", ")}`);
  }

  return { filled: totalFilled, skipped: totalSkipped, files: changedFiles, errors };
}

// ---------------------------------------------------------------------------
// CLI メイン
// ---------------------------------------------------------------------------
async function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run", "--per-directive"],
    options: ["--agent", "--timeout", "--id"],
    defaults: { agent: "", dryRun: false, timeout: String(DEFAULT_TIMEOUT_MS), perDirective: false, id: "" },
  });
  cli.timeout = Number(cli.timeout) || DEFAULT_TIMEOUT_MS;
  if (cli.help) {
    console.log([
      "Usage: node sdd-forge/engine/tfill.js --agent <name> [options]",
      "",
      "Options:",
      "  --agent <name>      AIエージェント: claude|codex (必須)",
      "  --id <id>           指定 ID の @text ディレクティブのみ処理",
      "  --dry-run           変更内容を表示するだけでファイル書き込みしない",
      "  --per-directive     1ディレクティブ=1呼び出しの旧モード（デフォルト: ファイル単位バッチ）",
      `  --timeout <ms>      エージェントタイムアウト (default: ${DEFAULT_TIMEOUT_MS})`,
      "  -h, --help          このヘルプを表示",
    ].join("\n"));
    return;
  }

  if (!cli.agent) {
    logger.log("ERROR: --agent is required. Use --agent claude or --agent codex.");
    process.exit(1);
  }

  const root = repoRoot(import.meta.url);
  const analysisPath = path.join(root, ".sdd-forge", "output", "analysis.json");

  let analysis = {};
  if (fs.existsSync(analysisPath)) {
    analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
  } else {
    logger.log(`WARN: analysis.json not found: ${analysisPath}`);
    logger.log("Proceeding with empty analysis context. Run 'sdd-forge scan' if needed.");
  }
  const cfg = loadConfig(root);
  const agent = loadAgentConfig(cfg, cli.agent);
  const preamblePatterns = loadPreamblePatterns(cfg);
  const projectContext = resolveProjectContext(root);
  const documentStyle = cfg.documentStyle;
  const lang = cfg.lang || "ja";
  const systemPrompt = buildTextSystemPrompt(projectContext, documentStyle, lang);
  const concurrency = Number(cfg.limits?.concurrency || 0) || DEFAULT_CONCURRENCY;
  const docsDir = path.join(root, "docs");
  const docsFiles = fs.readdirSync(docsDir)
    .filter((f) => /^\d{2}_/.test(f) && f.endsWith(".md"))
    .sort();

  let totalFilled = 0;
  let totalSkipped = 0;
  const changedFiles = new Set();

  // --id 指定時: per-directive モードを強制
  if (cli.id) {
    cli.perDirective = true;
    logger.verbose(`--id=${cli.id}: per-directive mode forced.`);
  }

  const processFn = cli.perDirective ? processTemplate : processTemplateFileBatch;
  if (!cli.perDirective) {
    logger.verbose(`Mode: batch (file-level, ${docsFiles.length} file(s), concurrency=${concurrency}). Use --per-directive for legacy mode.`);
  }

  // Prepare file entries (filter for --id before parallel dispatch)
  const fileEntries = [];
  for (const file of docsFiles) {
    const filePath = path.join(docsDir, file);
    const original = fs.readFileSync(filePath, "utf8");

    if (cli.id) {
      const directives = parseDirectives(original);
      const hasId = directives.some((d) => d.type === "text" && d.params?.id === cli.id);
      if (!hasId) continue;
    }

    fileEntries.push({ file, filePath, original });
  }

  // File-level concurrency: batch mode can parallelize files (1 call each),
  // per-directive mode processes files sequentially to avoid concurrency² explosion
  const fileConcurrency = cli.perDirective ? 1 : concurrency;
  const fileResults = new Array(fileEntries.length);
  const errors = [];
  await new Promise((resolve) => {
    let running = 0;
    let idx = 0;

    function next() {
      if (idx >= fileEntries.length && running === 0) {
        resolve();
        return;
      }
      while (running < fileConcurrency && idx < fileEntries.length) {
        const fileIdx = idx++;
        const { file, original } = fileEntries[fileIdx];
        running++;

        logger.verbose(`start: ${file}`);

        processFn(original, analysis, file, agent, cli.timeout, root, cli.dryRun, preamblePatterns, systemPrompt, cli.id || undefined, concurrency)
          .then(async (result) => {
            // バッチモードで 0 filled になった場合は per-directive モードで再試行
            if (!cli.perDirective && !cli.dryRun && result.filled === 0) {
              const textFills = parseDirectives(original).filter((d) => d.type === "text");
              if (textFills.length > 0) {
                logger.verbose(`Batch returned 0 filled for ${file}. Falling back to per-directive mode...`);
                result = await processTemplate(original, analysis, file, agent, cli.timeout, root, cli.dryRun, preamblePatterns, systemPrompt, cli.id || undefined, concurrency);
              }
            }
            fileResults[fileIdx] = result;
            logger.verbose(`done: ${file}`);
          })
          .catch((err) => {
            logger.log(`ERROR processing ${file}:`);
            logger.log(err.message);
            errors.push(file);
            fileResults[fileIdx] = null;
          })
          .finally(() => {
            running--;
            next();
          });
      }
    }

    next();
  });

  // Apply results
  for (let i = 0; i < fileEntries.length; i++) {
    const { file, filePath } = fileEntries[i];
    const result = fileResults[i];
    if (!result) continue;

    totalFilled += result.filled;
    totalSkipped += result.skipped;

    if (result.filled > 0) {
      changedFiles.add(file);
      if (!cli.dryRun) {
        fs.writeFileSync(filePath, result.text);
        logger.verbose(`UPDATED: ${file}`);
      }
    }
  }

  if (errors.length > 0) {
    logger.log(`${errors.length} file(s) failed: ${errors.join(", ")}`);
  }
  logger.log(`Done. ${changedFiles.size} file(s) updated. filled: ${totalFilled}, skipped: ${totalSkipped}.`);
  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
  });
}

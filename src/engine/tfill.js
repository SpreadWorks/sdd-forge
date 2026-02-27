#!/usr/bin/env node
/**
 * sdd-forge/engine/tfill.js
 *
 * @text-fill ディレクティブ専用プロセッサ。
 * テンプレート内の @text-fill を LLM エージェント（claude / codex）で解決し、
 * ディレクティブ直後に説明文を挿入する。
 *
 * Usage:
 *   node sdd-forge/engine/tfill.js --agent claude [--dry-run] [--timeout 60000]
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { parseDirectives } from "./directive-parser.js";
import { repoRoot, parseArgs } from "../lib/cli.js";
import { loadJsonFile } from "../lib/config.js";

// ---------------------------------------------------------------------------
// 設定読み込み
// ---------------------------------------------------------------------------
function loadConfig(root) {
  return loadJsonFile(path.join(root, ".sdd-forge", "config.json"));
}

function loadAgentConfig(root, agentName) {
  const cfg = loadConfig(root);
  const providerKey = agentName || cfg.defaultAgent;
  const provider = cfg.providers?.[providerKey];
  if (!provider) {
    throw new Error(`Unknown agent provider: ${providerKey}. Available: ${Object.keys(cfg.providers || {}).join(", ")}`);
  }
  return provider;
}

/**
 * config.json の textFill.preamblePatterns を RegExp 配列に変換する。
 */
function loadPreamblePatterns(root) {
  const cfg = loadConfig(root);
  const entries = cfg.textFill?.preamblePatterns;
  if (!Array.isArray(entries) || entries.length === 0) return [];
  return entries.map((e) => new RegExp(e.pattern, e.flags || ""));
}

// ---------------------------------------------------------------------------
// 解析データからファイル別コンテキストを動的に選択
// ---------------------------------------------------------------------------

/**
 * @data-fill カテゴリ名 → analysis.json の必要セクションへのマッピング。
 * ファイル内の @data-fill ディレクティブのカテゴリから、@text-fill に渡す
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
 * ファイル内の全ディレクティブから、@text-fill に必要なコンテキストデータを
 * 動的に収集する。@data-fill のカテゴリ名をキーにして analysis.json の
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

  // @data-fill カテゴリから必要なセクションを収集
  const dataFills = directives.filter((d) => d.type === "data-fill");
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

  // extras 全キーのサマリーも含める（@text-fill のプロンプトが任意の情報を参照できるように）
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
function buildPrompt(directive, fileName, lines, contextData) {
  const directiveLine = directive.line;

  // ±20行のコンテキストを抽出
  const contextStart = Math.max(0, directiveLine - 20);
  const contextEnd = Math.min(lines.length, directiveLine + 21);
  const surroundingLines = lines.slice(contextStart, contextEnd).join("\n");

  // 解析データ JSON（サイズ制限）
  const contextJson = JSON.stringify(contextData, null, 2);
  const truncatedJson = contextJson.length > 8000
    ? contextJson.slice(0, 8000) + "\n... (truncated)"
    : contextJson;

  return [
    "あなたはソフトウェアプロジェクトのテクニカルドキュメントを作成しています。",
    "以下の指示に従い、ドキュメントに挿入するマークダウンテキストを生成してください。",
    "",
    "## 指示",
    directive.prompt,
    "",
    "## 出力ルール（厳守）",
    "- 本文のマークダウンテキストのみを出力すること",
    "- 前置き・メタコメンタリーは絶対に含めないこと（例: 「以下に生成します」「Based on the analysis data」「Here is the generated text」等は禁止）",
    "- 水平線（---）を装飾目的で使わないこと",
    "- コードブロック（```）で全体を囲まないこと",
    "- セクション見出し（#）は含めない（挿入先に既にある）",
    "- 解析データに基づく事実のみ記述（推測は避ける）",
    "- 簡潔かつ正確に（3〜15行程度）",
    "- 1行目から本文を開始すること（空行や導入文で始めない）",
    "",
    `## 挿入先コンテキスト（${fileName}）`,
    surroundingLines,
    "",
    "## ソースコード解析データ",
    truncatedJson,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// エージェント呼び出し
// ---------------------------------------------------------------------------
function callAgent(agent, prompt, timeoutMs, cwd, preamblePatterns) {
  const args = Array.isArray(agent.args) ? [...agent.args] : [];
  const resolvedArgs = args.map((a) =>
    typeof a === "string" ? a.replaceAll("{{PROMPT}}", prompt) : a
  );
  // {{PROMPT}} トークンがなかった場合は末尾に追加
  const hasToken = args.some((a) => typeof a === "string" && a.includes("{{PROMPT}}"));
  const finalArgs = hasToken ? resolvedArgs : [...resolvedArgs, prompt];

  const result = execFileSync(agent.command, finalArgs, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: timeoutMs,
    cwd,
  });

  return stripPreamble(result.trim(), preamblePatterns);
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
 * 1 ファイルの @text-fill ディレクティブをすべて処理する。
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
function processTemplate(text, analysis, fileName, agent, timeoutMs, cwd, dryRun, preamblePatterns) {
  const directives = parseDirectives(text);
  const textFills = directives.filter((d) => d.type === "text-fill");

  if (textFills.length === 0) return { text, filled: 0, skipped: 0 };

  const lines = text.split("\n");
  const contextData = getAnalysisContext(analysis, directives);
  let filled = 0;
  let skipped = 0;

  // 後ろから処理して行番号のズレを防ぐ
  for (let i = textFills.length - 1; i >= 0; i--) {
    const d = textFills[i];
    const prompt = buildPrompt(d, fileName, lines, contextData);

    if (dryRun) {
      console.log(`[tfill] DRY-RUN ${fileName}:${d.line + 1}: ${d.prompt.slice(0, 80)}`);
      console.log(`[tfill]   prompt length: ${prompt.length} chars`);
      skipped++;
      continue;
    }

    console.error(`[tfill] Processing ${fileName}:${d.line + 1}: ${d.prompt.slice(0, 60)}...`);

    let generated;
    try {
      generated = callAgent(agent, prompt, timeoutMs, cwd, preamblePatterns);
    } catch (err) {
      console.error(`[tfill] ERROR calling agent for ${fileName}:${d.line + 1}: ${err.message.slice(0, 200)}`);
      skipped++;
      continue;
    }

    if (!generated) {
      console.error(`[tfill] WARN: empty response for ${fileName}:${d.line + 1}`);
      skipped++;
      continue;
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
    console.error(`[tfill] FILLED ${fileName}:${d.line + 1} (${generated.split("\n").length} lines)`);
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
export function textFillFromAnalysis(root, analysis, agentName) {
  if (!analysis) return { filled: 0, skipped: 0, files: [] };

  const agent = loadAgentConfig(root, agentName);
  const preamblePatterns = loadPreamblePatterns(root);
  const docsDir = path.join(root, "docs");
  const docsFiles = fs.readdirSync(docsDir)
    .filter((f) => /^\d{2}_/.test(f) && f.endsWith(".md"))
    .sort();

  const changedFiles = [];
  let totalFilled = 0;
  let totalSkipped = 0;

  for (const file of docsFiles) {
    const filePath = path.join(docsDir, file);
    const original = fs.readFileSync(filePath, "utf8");
    const result = processTemplate(original, analysis, file, agent, 120000, root, false, preamblePatterns);

    totalFilled += result.filled;
    totalSkipped += result.skipped;

    if (result.filled > 0) {
      fs.writeFileSync(filePath, result.text);
      changedFiles.push(file);
    }
  }

  return { filled: totalFilled, skipped: totalSkipped, files: changedFiles };
}

// ---------------------------------------------------------------------------
// CLI メイン
// ---------------------------------------------------------------------------
function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run"],
    options: ["--agent", "--timeout"],
    defaults: { agent: "", dryRun: false, timeout: "120000" },
  });
  cli.timeout = Number(cli.timeout) || 120000;
  if (cli.help) {
    console.log([
      "Usage: node sdd-forge/engine/tfill.js --agent <name> [options]",
      "",
      "Options:",
      "  --agent <name>   AIエージェント: claude|codex (必須)",
      "  --dry-run        変更内容を表示するだけでファイル書き込みしない",
      "  --timeout <ms>   エージェントタイムアウト (default: 120000)",
      "  -h, --help       このヘルプを表示",
    ].join("\n"));
    return;
  }

  if (!cli.agent) {
    console.error("[tfill] ERROR: --agent is required. Use --agent claude or --agent codex.");
    process.exit(1);
  }

  const root = repoRoot(import.meta.url);
  const analysisPath = path.join(root, ".sdd-forge", "output", "analysis.json");

  if (!fs.existsSync(analysisPath)) {
    console.error(`[tfill] ERROR: analysis.json not found: ${analysisPath}`);
    console.error("[tfill] Run 'npm run sdd:scan' first.");
    process.exit(1);
  }

  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
  const agent = loadAgentConfig(root, cli.agent);
  const preamblePatterns = loadPreamblePatterns(root);
  const docsDir = path.join(root, "docs");
  const docsFiles = fs.readdirSync(docsDir)
    .filter((f) => /^\d{2}_/.test(f) && f.endsWith(".md"))
    .sort();

  let totalFilled = 0;
  let totalSkipped = 0;
  const changedFiles = new Set();

  for (const file of docsFiles) {
    const filePath = path.join(docsDir, file);
    const original = fs.readFileSync(filePath, "utf8");
    const result = processTemplate(original, analysis, file, agent, cli.timeout, root, cli.dryRun, preamblePatterns);

    totalFilled += result.filled;
    totalSkipped += result.skipped;

    if (result.filled > 0) {
      changedFiles.add(file);
      if (!cli.dryRun) {
        fs.writeFileSync(filePath, result.text);
        console.error(`[tfill] UPDATED: ${file}`);
      }
    }
  }

  console.error(`[tfill] Done. ${changedFiles.size} file(s) updated. filled: ${totalFilled}, skipped: ${totalSkipped}.`);
}

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

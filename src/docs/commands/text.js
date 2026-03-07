#!/usr/bin/env node
/**
 * sdd-forge/engine/tfill.js
 *
 * {{text}} ディレクティブ専用プロセッサ。
 * テンプレート内の {{text}} を LLM エージェント（claude / codex）で解決し、
 * ディレクティブ直後に説明文を挿入する。
 *
 * Usage:
 *   node sdd-forge/engine/tfill.js --agent claude [--dry-run] [--timeout 60000] [--id <id>]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseDirectives } from "../lib/directive-parser.js";
import {
  getAnalysisContext,
  buildTextSystemPrompt,
  buildPrompt,
  buildFileSystemPrompt,
  buildBatchPrompt,
  formatLimitRule,
} from "../lib/text-prompts.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig, loadUiLang, sddOutputDir, resolveProjectContext } from "../../lib/config.js";
import { createLogger } from "../../lib/progress.js";
import { callAgent as callAgentBase, callAgentAsync as callAgentAsyncBase, ensureAgentWorkDir, loadAgentConfig, MID_AGENT_TIMEOUT_MS } from "../../lib/agent.js";
import { createI18n } from "../../lib/i18n.js";

const logger = createLogger("text");

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_TIMEOUT_MS = MID_AGENT_TIMEOUT_MS;

/**
 * config の textFill.preamblePatterns を RegExp 配列に変換する。
 */
function loadPreamblePatterns(cfg) {
  const entries = cfg.textFill?.preamblePatterns;
  if (!Array.isArray(entries) || entries.length === 0) return [];
  return entries.map((e) => new RegExp(e.pattern, e.flags || ""));
}

// ---------------------------------------------------------------------------
// バッチモード：ファイル単位で全ディレクティブを1回の LLM 呼び出しで処理
// ---------------------------------------------------------------------------

/**
 * テンプレートファイルの {{text}} ディレクティブ後にある既存生成コンテンツを
 * 除去してクリーンなテンプレート状態に戻す。
 * processTemplate の endLine 計算と同じ境界ロジックを使用する。
 */
function stripFillContent(text) {
  const lines = text.split("\n");
  const result = [];
  let i = 0;
  while (i < lines.length) {
    result.push(lines[i]);
    if (/^<!--\s*\{\{text\s*(?:\[[^\]]*\])?\s*:/.test(lines[i].trim())) {
      i++;
      while (i < lines.length) {
        const ln = lines[i].trim();
        if (ln.startsWith("#") || ln.startsWith("<!-- {{")) break;
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
    if (/^<!--\s*\{\{text\s*(?:\[[^\]]*\])?\s*:/.test(lines[i].trim())) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length &&
          !lines[j].trim().startsWith("## ") &&
          !lines[j].trim().startsWith("<!-- {{")) {
        filled++;
      }
    }
  }
  return filled;
}

/**
 * ファイル内のすべての {{text}} ディレクティブを1回の LLM 呼び出しで処理する。
 * 既存の生成済みコンテンツを stripFillContent で除去してからプロンプトを組み立てる。
 *
 * @returns {{ text: string, filled: number, skipped: number }}
 */
async function processTemplateFileBatch(text, analysis, fileName, agent, timeoutMs, cwd, dryRun, _preamblePatterns, systemPrompt, _filterId, _concurrency, lang) {
  const directives = parseDirectives(text);
  const textFills = directives.filter((d) => d.type === "text");

  if (textFills.length === 0) return { text, filled: 0, skipped: 0 };

  const cleanText = stripFillContent(text);
  const prompt = buildBatchPrompt(fileName, cleanText, textFills, lang);

  if (dryRun) {
    console.log(`[text] DRY-RUN batch ${fileName}: ${textFills.length} directive(s) → 1 call (${prompt.length} chars)`);
    return { text, filled: 0, skipped: textFills.length };
  }

  logger.verbose(`Batch ${fileName}: ${textFills.length} directive(s) → 1 call`);

  // バッチはファイル全体を返すので preamble パターンは使わない
  // 空レスポンスが返る場合は1回だけリトライする
  let result = await callAgentAsync(agent, prompt, timeoutMs, cwd, [], systemPrompt);

  if (!result) {
    logger.verbose(`empty response for ${fileName}, retrying after 3s...`);
    await new Promise((r) => setTimeout(r, 3000));
    result = await callAgentAsync(agent, prompt, timeoutMs, cwd, [], systemPrompt);
  }

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
 * 1 ファイルの {{text}} ディレクティブをすべて処理する。
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
async function processTemplate(text, analysis, fileName, agent, timeoutMs, cwd, dryRun, preamblePatterns, systemPrompt, filterId, concurrency, lang) {
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
  const fileSystemPrompt = buildFileSystemPrompt(systemPrompt, contextData, lang);

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
      if (ln.startsWith("#") || ln.startsWith("<!-- {{")) break;
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

  // Batch mode: file-level parallelism (1 call per file)
  const fileResults = new Array(docsFiles.length);
  const errors = [];
  await new Promise((resolve) => {
    let running = 0;
    let idx = 0;

    function next() {
      if (idx >= docsFiles.length && running === 0) {
        resolve();
        return;
      }
      while (running < concurrency && idx < docsFiles.length) {
        const fileIdx = idx++;
        const file = docsFiles[fileIdx];
        running++;

        const filePath = path.join(docsDir, file);
        const original = fs.readFileSync(filePath, "utf8");

        processTemplateFileBatch(original, analysis, file, agent, DEFAULT_TIMEOUT_MS, root, false, preamblePatterns, systemPrompt, undefined, undefined, lang)
          .then((result) => {
            if (result.filled === 0) {
              const textFills = parseDirectives(original).filter((d) => d.type === "text");
              if (textFills.length > 0) {
                errors.push(file);
                logger.log(`Batch returned 0 filled for ${file} (${textFills.length} directives). Re-run with --per-directive for retry.`);
              }
            }
            fileResults[fileIdx] = { file, filePath, result };
          })
          .catch((err) => {
            logger.log(`ERROR processing ${file}:`);
            logger.log(err.message);
            errors.push(file);
            fileResults[fileIdx] = { file, filePath, result: null };
          })
          .finally(() => {
            running--;
            next();
          });
      }
    }

    next();
  });

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
    options: ["--agent", "--timeout", "--id", "--lang", "--docs-dir"],
    defaults: { agent: "", dryRun: false, timeout: String(DEFAULT_TIMEOUT_MS), perDirective: false, id: "", lang: "", docsDir: "" },
  });
  cli.timeout = Number(cli.timeout) || DEFAULT_TIMEOUT_MS;
  if (cli.help) {
    const tu = createI18n(loadUiLang(repoRoot(import.meta.url)));
    const h = tu.raw("help.cmdHelp.text");
    const o = h.options;
    console.log([
      h.usage, "", "Options:",
      `  ${tu("help.cmdHelp.text.options.agent")}`,
      `  ${o.id}`, `  ${o.dryRun}`, `  ${o.perDirective}`,
      `  ${tu("help.cmdHelp.text.options.timeout", { default: DEFAULT_TIMEOUT_MS })}`,
      `  ${o.help}`,
    ].join("\n"));
    return;
  }

  if (!cli.agent) {
    logger.log("ERROR: --agent is required. Use --agent claude or --agent codex.");
    process.exit(1);
  }

  const root = repoRoot(import.meta.url);
  const analysisPath = path.join(sddOutputDir(root), "analysis.json");

  let analysis = {};
  if (fs.existsSync(analysisPath)) {
    analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
  } else {
    logger.log(`WARN: analysis.json not found: ${analysisPath}`);
    logger.log("Proceeding with empty analysis context. Run 'sdd-forge scan' if needed.");
  }
  const cfg = loadConfig(root);
  const agent = loadAgentConfig(cfg, cli.agent);

  ensureAgentWorkDir(agent, root);

  const preamblePatterns = loadPreamblePatterns(cfg);
  const projectContext = resolveProjectContext(root);
  const documentStyle = cfg.documentStyle;
  const lang = cli.lang || cfg.lang || "ja";
  const systemPrompt = buildTextSystemPrompt(projectContext, documentStyle, lang);
  const concurrency = Number(cfg.limits?.concurrency || 0) || DEFAULT_CONCURRENCY;
  const docsDir = cli.docsDir ? path.resolve(root, cli.docsDir) : path.join(root, "docs");
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
    logger.verbose(`Mode: batch (file-level, ${docsFiles.length} file(s), concurrency=${concurrency}). Use --per-directive for single-call mode.`);
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

        processFn(original, analysis, file, agent, cli.timeout, root, cli.dryRun, preamblePatterns, systemPrompt, cli.id || undefined, concurrency, lang)
          .then((result) => {
            if (!cli.perDirective && !cli.dryRun && result.filled === 0) {
              const textFills = parseDirectives(original).filter((d) => d.type === "text");
              if (textFills.length > 0) {
                errors.push(file);
                logger.log(`Batch returned 0 filled for ${file} (${textFills.length} directives). Re-run with --per-directive for retry.`);
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

export { main, stripFillContent, countFilledInBatch, processTemplateFileBatch };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
  });
}

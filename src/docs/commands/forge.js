#!/usr/bin/env node
/**
 * sdd-forge/forge/forge.js
 *
 * Prompt 起点で docs 改善を反復する。
 * 1) AI に generated docs(01..10) を更新させる
 * 2) docs:generate を実行
 * 3) docs:review を実行
 * 4) NG の場合は失敗内容を次ラウンドへフィードバックして再実行
 *
 * 途中でコード外情報が必要な場合、AI は `NEEDS_INPUT` を出力し、処理を中断する。
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { execFile, spawn } from "child_process";
import { stdout as output } from "process";
import { fileURLToPath } from "url";
import { populateFromAnalysis } from "./data.js";
import { textFillFromAnalysis } from "./text.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadJsonFile, loadConfig, saveContext } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { createResolver } from "../lib/resolver-factory.js";

// npm パッケージとして呼ばれた場合でもサブスクリプトを直接起動できるよう
// パッケージディレクトリを保持する
const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const DEFAULT_AGENT_TIMEOUT_MS = 1800000;
const DEFAULT_WAIT_LOG_SEC = 1;
const DEFAULT_MAX_RUNS = 3;
const DEFAULT_REVIEW_CMD = "sdd-forge review";
const DEFAULT_MODE = "local";

function getTargetFiles(root) {
  const docsDir = path.join(root, "docs");
  if (!fs.existsSync(docsDir)) return [];
  return fs.readdirSync(docsDir)
    .filter((f) => /^\d{2}_.*\.md$/.test(f))
    .sort()
    .map((f) => `docs/${f}`);
}

const FALLBACK_PATCH_ORDER = Object.freeze([
  "controllers",
  "tables",
  "headings",
  "sections",
]);

function readText(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}


function resolveAgent(cfg, role, cliAgent) {
  const providerKey = cliAgent || cfg.agents?.[role]?.provider || cfg.defaultAgent;
  if (cfg.providers?.[providerKey]) {
    return cfg.providers[providerKey];
  }
  const legacy = cfg.agents?.[role];
  if (legacy?.command) {
    return legacy;
  }
  return null;
}

function loadAnalysisData(root) {
  const p = path.join(root, ".sdd-forge", "output", "analysis.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (_) {
    return null;
  }
}

function buildAnalysisSummary(analysis) {
  if (!analysis) return "";
  const parts = [];
  if (analysis.controllers) {
    const c = analysis.controllers;
    parts.push(`Controllers: ${c.summary.total} files, ${c.summary.totalActions} actions`);
    for (const ctrl of c.controllers.slice(0, 10)) {
      parts.push(`  - ${ctrl.className}: ${ctrl.actions.length} actions [${ctrl.actions.slice(0, 5).join(", ")}${ctrl.actions.length > 5 ? " ..." : ""}]`);
    }
    if (c.controllers.length > 10) {
      parts.push(`  ... and ${c.controllers.length - 10} more`);
    }
  }
  if (analysis.models) {
    const m = analysis.models;
    parts.push(`Models: ${m.summary.total} files (fe=${m.summary.feModels}, logic=${m.summary.logicModels})`);
    if (m.summary.dbGroups) {
      for (const [db, models] of Object.entries(m.summary.dbGroups)) {
        parts.push(`  DB[${db}]: ${models.length} models`);
      }
    }
  }
  if (analysis.shells) {
    const s = analysis.shells;
    parts.push(`Shells: ${s.summary.total} files`);
    for (const sh of s.shells) {
      parts.push(`  - ${sh.className}: [${sh.publicMethods.join(", ")}]`);
    }
  }
  if (analysis.routes) {
    parts.push(`Routes: ${analysis.routes.summary.total} explicit routes`);
  }
  return parts.join("\n");
}

function parseCliOptions(argv) {
  const opts = parseArgs(argv, {
    flags: ["--verbose", "--auto-update-context", "--dry-run"],
    options: ["--prompt", "--prompt-file", "--spec", "--max-runs", "--review-cmd", "--agent", "--mode"],
    aliases: { "-v": "--verbose" },
    defaults: {
      prompt: "",
      promptFile: "",
      spec: "",
      agent: "",
      verbose: false,
      autoUpdateContext: false,
      dryRun: false,
      maxRuns: String(DEFAULT_MAX_RUNS),
      reviewCmd: DEFAULT_REVIEW_CMD,
      mode: DEFAULT_MODE,
    },
  });
  if (!opts.help) {
    const n = Number(opts.maxRuns);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error("--max-runs must be > 0");
    }
    opts.maxRuns = Math.floor(n);
    if (!["local", "assist", "agent"].includes(opts.mode)) {
      throw new Error("--mode must be one of: local, assist, agent");
    }
  }
  return opts;
}

function printHelp() {
  output.write(
    [
      "Usage: node sdd-forge/forge/forge.js --prompt \"...\" [options]",
      "",
      "Options:",
      "  --prompt <text>        開始プロンプト",
      "  --prompt-file <path>   開始プロンプトファイル",
      "  --spec <path>          入力仕様書（spec.md）",
      "  --max-runs <n>         反復回数 (default: 5)",
      "  --review-cmd <cmd>     docs レビューコマンド (default: npm run sdd:review)",
      "  --agent <name>         AIエージェント: codex|claude (default: config.json の defaultAgent)",
      "  --mode <mode>          実行モード: local|assist|agent (default: local)",
      "  --dry-run              ファイル書き込み・review・agent 呼び出しをスキップ（1 ラウンドで終了）",
      "  --auto-update-context  review 成功後に context.json を確認なしで自動更新",
      "  -v, --verbose          エージェント実行ログを逐次表示",
      "  -h, --help             このヘルプを表示",
      "",
      "NEEDS_INPUT:",
      "  追加情報が必要な場合、AI は次形式で出力すること:",
      "  NEEDS_INPUT",
      "  - 質問1",
      "  - 質問2",
      "",
    ].join("\n")
  );
}

function buildArgs(agent, prompt) {
  const args = Array.isArray(agent.args) ? [...agent.args] : [];
  const hasToken = args.some(
    (a) => typeof a === "string" && a.includes("{{PROMPT}}")
  );
  if (hasToken) {
    return args.map((a) =>
      typeof a === "string" ? a.replaceAll("{{PROMPT}}", prompt) : a
    );
  }
  return [...args, prompt];
}

function runAgent(agent, prompt, options = {}) {
  const requestedTimeoutMs = Number(
    options.timeoutMs ?? agent?.timeoutMs ?? DEFAULT_AGENT_TIMEOUT_MS
  );
  const timeoutMs =
    Number.isFinite(requestedTimeoutMs) && requestedTimeoutMs > 0
      ? requestedTimeoutMs
      : DEFAULT_AGENT_TIMEOUT_MS;
  const waitLogSec = Number(options.waitLogSec ?? DEFAULT_WAIT_LOG_SEC);
  const runCwd = options.cwd ? path.resolve(String(options.cwd)) : undefined;
  const label = String(
    options.label || agent?.name || agent?.command || "agent"
  );
  const streamOutput = options.streamOutput === true;
  const args = buildArgs(agent, prompt);

  return new Promise((resolve, reject) => {
    const ticker =
      waitLogSec > 0 && !streamOutput
        ? setInterval(() => output.write("."), waitLogSec * 1000)
        : null;

    output.write(
      `[agent] ${label} started (timeout: ${Math.floor(timeoutMs / 1000)}s)\n`
    );

    if (streamOutput) {
      let stdoutBuf = "";
      let stderrBuf = "";
      let timedOut = false;
      const child = spawn(agent.command, args, {
        cwd: runCwd,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const timeoutTimer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, timeoutMs);

      child.stdout?.on("data", (chunk) => {
        const text = String(chunk);
        stdoutBuf += text;
        output.write(text);
      });

      child.stderr?.on("data", (chunk) => {
        const text = String(chunk);
        stderrBuf += text;
        output.write(text);
      });

      child.on("error", (err) => {
        if (ticker) clearInterval(ticker);
        clearTimeout(timeoutTimer);
        reject(new Error(`Agent failed: ${agent.command}\n${err.message}`));
      });

      child.on("close", (code, signal) => {
        if (ticker) clearInterval(ticker);
        clearTimeout(timeoutTimer);
        if (code === 0 && !signal) {
          resolve(stdoutBuf.trim());
          return;
        }
        reject(
          new Error(
            [
              `Agent failed: ${agent.command}`,
              timedOut ? `Timeout: ${Math.floor(timeoutMs / 1000)}s` : "",
              signal ? `Signal: ${signal}` : "",
              stderrBuf ? stderrBuf.slice(0, 4000) : "",
              `Exit code: ${code}`,
            ]
              .filter(Boolean)
              .join("\n")
          )
        );
      });
      return;
    }

    execFile(
      agent.command,
      args,
      { maxBuffer: 20 * 1024 * 1024, timeout: timeoutMs, cwd: runCwd },
      (err, stdout, stderr) => {
        if (ticker) clearInterval(ticker);
        if (err) {
          const timedOut = err.killed === true;
          reject(
            new Error(
              [
                `Agent failed: ${agent.command}`,
                timedOut ? `Timeout: ${Math.floor(timeoutMs / 1000)}s` : "",
                stderr ? String(stderr).slice(0, 3000) : "",
                err.message,
              ]
                .filter(Boolean)
                .join("\n")
            )
          );
          return;
        }
        resolve(String(stdout).trim());
      }
    );
  });
}

function runShell(cmd, cwd) {
  return new Promise((resolve) => {
    execFile(
      "bash",
      ["-c", cmd],
      { cwd, maxBuffer: 20 * 1024 * 1024 },
      (err, stdout, stderr) => {
        resolve({
          ok: !err,
          code: err?.code ?? 0,
          stdout: String(stdout || ""),
          stderr: String(stderr || ""),
        });
      }
    );
  });
}

function extractNeedsInput(out) {
  const text = String(out || "");
  const idx = text.indexOf("NEEDS_INPUT");
  if (idx < 0) return [];
  const tail = text.slice(idx).split("\n");
  const qs = [];
  for (const line of tail.slice(1)) {
    const s = line.trim();
    if (s.startsWith("- ")) {
      qs.push(s.slice(2).trim());
      continue;
    }
    if (s.length === 0) continue;
    break;
  }
  return qs.filter(Boolean);
}

function summarizeReview(outputText) {
  const lines = String(outputText || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const fails = lines.filter((l) => l.includes("[FAIL]"));
  const coverage = lines.filter(
    (l) =>
      l.includes("Controller coverage:") ||
      l.includes("DB table coverage:") ||
      l.includes("quality check:")
  );
  const picked = [...fails.slice(0, 40), ...coverage].join("\n");
  return picked || "(no parsed failures)";
}

function parseReviewMisses(outputText) {
  const controllers = [];
  const tables = [];
  const headings = [];
  const sections = [];
  const lines = String(outputText || "").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    const ctrl = line.match(/^\[MISS\]\s+([A-Za-z0-9_]+)$/);
    if (ctrl?.[1]) {
      controllers.push(ctrl[1]);
      continue;
    }
    const table = line.match(/^\[MISS\]\s+table\s+([a-zA-Z0-9_]+)/);
    if (table?.[1]) {
      tables.push(table[1]);
      continue;
    }
    const heading = line.match(/^\[FAIL\]\s+missing heading:\s+(.+)/i);
    if (heading?.[1]) {
      headings.push(heading[1].trim());
      continue;
    }
    const section = line.match(/^\[FAIL\]\s+missing section:\s+(.+)/i);
    if (section?.[1]) {
      sections.push(section[1].trim());
    }
  }
  const sortUniq = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b));
  return {
    controllers: sortUniq(controllers),
    tables: sortUniq(tables),
    headings: sortUniq(headings),
    sections: sortUniq(sections),
  };
}

function ensureSection(text, heading) {
  if (text.includes(heading)) return text;
  return `${text.trimEnd()}\n\n${heading}\n\n`;
}

function patchGeneratedForMisses(root, misses, analysisData) {
  let changed = false;
  const touched = [];

  // analysis データで populate 済みの場合、コントローラ・テーブルの「未整理」追記はスキップ
  // （本体テーブルに統合済みのため）
  const hasControllerData = !!analysisData?.controllers;
  const hasModelData = !!analysisData?.models;

  if (misses.controllers.length > 0 && !hasControllerData) {
    const p = path.join(
      root,
      "docs/08_controller_routes.md"
    );
    let s = readText(p);
    if (s) {
      s = ensureSection(s, "### 未整理コントローラ（自動補完）");
      for (const ctrl of misses.controllers) {
        if (!s.includes(ctrl)) {
          s += `- \`${ctrl}Controller\`\n`;
          changed = true;
        }
      }
      fs.writeFileSync(p, s.endsWith("\n") ? s : `${s}\n`);
      touched.push(path.relative(root, p));
    }
  }

  if (misses.tables.length > 0 && !hasModelData) {
    const p = path.join(
      root,
      "docs/07_db_tables.md"
    );
    let s = readText(p);
    if (s) {
      s = ensureSection(s, "### 未整理テーブル（自動補完）");
      for (const t of misses.tables) {
        if (!s.includes(t)) {
          s += `- \`${t}\`\n`;
          changed = true;
        }
      }
      fs.writeFileSync(p, s.endsWith("\n") ? s : `${s}\n`);
      touched.push(path.relative(root, p));
    }
  }

  if (misses.headings.length > 0 || misses.sections.length > 0) {
    const p = path.join(root, "docs/04_development.md");
    let s = readText(p);
    if (s) {
      if (misses.sections.length > 0) {
        s = ensureSection(s, "### 未整理項目（自動補完）");
        for (const section of misses.sections) {
          const bullet = `- ${section}`;
          if (!s.includes(bullet)) {
            s += `${bullet}\n`;
            changed = true;
          }
        }
      }
      if (misses.headings.length > 0) {
        s = ensureSection(s, "### 未整理見出し（自動補完）");
        for (const heading of misses.headings) {
          const bullet = `- ${heading}`;
          if (!s.includes(bullet)) {
            s += `${bullet}\n`;
            changed = true;
          }
        }
      }
      fs.writeFileSync(p, s.endsWith("\n") ? s : `${s}\n`);
      touched.push(path.relative(root, p));
    }
  }

  return { changed, touched };
}

function summarizeNeedsInput(reviewOut) {
  const lines = reviewOut
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.startsWith("[FAIL]") || x.startsWith("[MISS]"));
  const uniq = [...new Set(lines)];
  return uniq.slice(0, 8);
}

function buildForgePrompt({
  userPrompt,
  round,
  maxRuns,
  reviewFeedback,
  specPath,
  specText,
  analysisSummary,
  targetFiles,
}) {
  const files = targetFiles.map((f) => `- ${f}`).join("\n");
  const specBlock = specPath
    ? ["[SPEC_PATH]", specPath, "", "[SPEC_CONTENT]", specText || "(empty)", ""]
    : [];
  return [
    "あなたは docs-forge です。docs 品質を改善してください。",
    "",
    `round: ${round}/${maxRuns}`,
    "",
    "[USER_PROMPT]",
    userPrompt,
    "",
    ...specBlock,
    "[TARGET_FILES]",
    files,
    "",
    "[RULES]",
    "- 編集対象は TARGET_FILES のみ",
    "- 推測は避け、app/ sdd-forge/ specs/ の事実を優先",
    "- 既存の指摘を潰すために必要な最小限の変更を行う",
    "- 変更後に説明文は簡潔で主語を明確にする",
    "- 追加情報が必要で確定できない場合は、編集せず次だけを出力する:",
    "  NEEDS_INPUT",
    "  - 質問1",
    "  - 質問2",
    "",
    ...(analysisSummary
      ? ["[SOURCE_ANALYSIS]", analysisSummary, ""]
      : []),
    "[PREVIOUS_REVIEW_FEEDBACK]",
    reviewFeedback || "なし",
  ].join("\n");
}

/**
 * forge の review 成功後に projectContext を自動更新する。
 * docs/ の各章ファイル先頭を LLM に渡し、プロジェクト概要を生成させる。
 *
 * @param {string} root - リポジトリルート
 * @param {import("../lib/types.js").SddConfig} cfg
 * @param {Object} agent - エージェント設定
 * @param {number} timeoutMs - タイムアウト
 * @param {boolean} autoConfirm - true なら確認なしで書き込み
 */
async function maybeUpdateContext(root, cfg, agent, timeoutMs, autoConfirm) {
  const docsDir = path.join(root, "docs");
  if (!fs.existsSync(docsDir)) return;

  const files = fs.readdirSync(docsDir)
    .filter((f) => /^\d{2}_.*\.md$/.test(f))
    .sort();

  if (files.length === 0) return;

  // 各章の先頭500文字を抽出
  const snippets = files.map((f) => {
    const content = fs.readFileSync(path.join(docsDir, f), "utf8");
    return `### ${f}\n${content.slice(0, 500)}`;
  }).join("\n\n");

  const lang = cfg.lang || "ja";
  const promptText = lang === "en"
    ? [
        "Based on the following documentation snippets, generate a concise project overview (3-5 sentences).",
        "Output ONLY the overview text, no preamble or meta-commentary.",
        "",
        snippets,
      ].join("\n")
    : [
        "以下のドキュメント抜粋を基に、プロジェクト概要を3〜5文で生成してください。",
        "概要テキストのみを出力すること（前置きやメタコメンタリーは不要）。",
        "",
        snippets,
      ].join("\n");

  let generated;
  try {
    generated = await runAgent(agent, promptText, {
      label: "forge.context-update",
      cwd: root,
      timeoutMs,
    });
  } catch (err) {
    output.write(`[forge] context update skipped: ${String(err.message).slice(0, 200)}\n`);
    return;
  }

  if (!generated || generated.trim().length === 0) {
    output.write("[forge] context update skipped: empty response.\n");
    return;
  }

  const trimmed = generated.trim();
  output.write("\n[forge] Generated project context:\n");
  output.write(`${trimmed}\n\n`);

  let confirmed = autoConfirm;
  if (!confirmed) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => {
      rl.question("Update context.json? (y/N): ", resolve);
    });
    rl.close();
    confirmed = answer.trim().toLowerCase() === "y";
  }

  if (confirmed) {
    saveContext(root, { projectContext: trimmed });
    output.write("[forge] context.json updated.\n");
  } else {
    output.write("[forge] context.json update skipped.\n");
  }
}

async function main() {
  const cli = parseCliOptions(process.argv.slice(2));
  if (cli.help) {
    printHelp();
    return;
  }

  const root = repoRoot(import.meta.url);
  const cfg = loadConfig(root);
  const agent = resolveAgent(cfg, "docsForge", cli.agent);
  const mode = cli.mode || DEFAULT_MODE;
  const timeoutMs = Number(cfg.limits?.designTimeoutMs || 0) || undefined;

  if (mode === "agent" && !agent) {
    throw new Error(
      "forge: --mode=agent requires config.json agents.docsForge or providers",
    );
  }

  const analysisData = loadAnalysisData(root);
  const analysisSummary = buildAnalysisSummary(analysisData);
  if (analysisData && !cli.dryRun) {
    output.write("[forge] analysis data loaded.\n");
    const type = resolveType(cfg.type || "");
    let resolveFn = null;
    try {
      const resolver = await createResolver(type, root);
      resolveFn = (category, analysis) => resolver.resolve(category, analysis);
    } catch (err) {
      output.write(`[forge] WARN: resolver not available (${err.message}), skipping @data population\n`);
    }
    const populateResult = populateFromAnalysis(root, analysisData, resolveFn);
    if (populateResult.populated) {
      output.write(`[forge] populated placeholders in: ${populateResult.files.join(", ")}\n`);
    }
    if (agent) {
      const tfResult = textFillFromAnalysis(root, analysisData, cli.agent);
      if (tfResult.filled > 0) {
        output.write(`[forge] @text: ${tfResult.filled} directives resolved\n`);
      }
    }
  } else if (analysisData && cli.dryRun) {
    output.write("[forge] DRY-RUN: skipping @data population and @text fill\n");
  }

  let userPrompt = String(cli.prompt || "").trim();
  if (!userPrompt && cli.promptFile) {
    userPrompt = readText(path.resolve(root, cli.promptFile)).trim();
  }
  if (!userPrompt) {
    throw new Error("prompt is required. use --prompt or --prompt-file");
  }
  let specPath = "";
  let specText = "";
  if (cli.spec) {
    specPath = path.resolve(root, cli.spec);
    if (!fs.existsSync(specPath)) {
      throw new Error(`spec not found: ${specPath}`);
    }
    specText = readText(specPath).trim();
  }

  const effectiveMaxRuns = cli.dryRun ? 1 : cli.maxRuns;

  output.write(
    [
      "",
      "=== forge ===",
      `maxRuns: ${effectiveMaxRuns}${cli.dryRun ? " (dry-run)" : ""}`,
      `mode: ${mode}`,
      `review: ${cli.dryRun ? "(skipped)" : cli.reviewCmd}`,
      specPath ? `spec: ${path.relative(root, specPath)}` : "spec: (not set)",
      "",
    ].join("\n")
  );

  if (cli.dryRun) {
    output.write("[forge] DRY-RUN: target files:\n");
    for (const f of getTargetFiles(root)) {
      output.write(`  - ${f}\n`);
    }
    output.write("[forge] DRY-RUN: no files written, no review, no agent calls.\n");
    output.write("\n=== DONE (dry-run) ===\n");
    return;
  }

  let reviewFeedback = "";
  for (let round = 1; round <= effectiveMaxRuns; round += 1) {
    output.write(`\n[forge] round ${round}/${effectiveMaxRuns}\n`);
    output.write(`[forge] run mode=${mode} review='${cli.reviewCmd}'\n`);
    let usedAgent = false;
    let agentFailed = false;
    if (mode === "assist" || mode === "agent") {
      if (!agent) {
        if (mode === "assist") {
          output.write("[forge] assist mode: agent not configured, run local-only.\n");
        }
      } else {
        const prompt = buildForgePrompt({
          userPrompt,
          round,
          maxRuns: effectiveMaxRuns,
          reviewFeedback,
          specPath: specPath ? path.relative(root, specPath) : "",
          specText,
          analysisSummary,
          targetFiles: getTargetFiles(root),
        });
        try {
          const out = await runAgent(agent, prompt, {
            label: "forge.generate",
            cwd: root,
            timeoutMs,
            streamOutput: cli.verbose,
          });
          usedAgent = true;

          const needsInput = extractNeedsInput(out);
          if (needsInput.length > 0) {
            output.write("\n[forge] NEEDS_INPUT detected.\n");
            output.write("追加情報が必要です。以下に回答してください:\n");
            for (const q of needsInput) {
              output.write(`- ${q}\n`);
            }
            process.exitCode = 2;
            return;
          }
        } catch (e) {
          agentFailed = true;
          if (mode === "agent") {
            throw e;
          }
          output.write(
            `[forge] agent step failed. continue with local pipeline.\n${String(
              e instanceof Error ? e.message : e
            ).slice(0, 500)}\n`,
          );
        }
      }
    }

    // docs/ を直接編集するため generate ステップは不要

    const review = await runShell(cli.reviewCmd, root);
    output.write(`[forge] review: ${review.ok ? "ok" : "failed"} (code=${review.code})\n`);
    if (review.ok) {
      output.write("[forge] review passed.\n");
      if (cfg.documentStyle && agent) {
        await maybeUpdateContext(root, cfg, agent, timeoutMs, cli.autoUpdateContext);
      }
      const readme = await runShell(`node "${path.join(PKG_DIR, "docs", "commands", "readme.js")}"`, root);
      output.write(`[forge] README.md ${readme.ok ? "updated" : "update failed"}.\n`);
      output.write("\n=== DONE ===\n- forge completed\n");
      return;
    }

    const reviewOut = `${review.stdout}\n${review.stderr}`;
    reviewFeedback = summarizeReview(reviewOut);
    output.write("[forge] review failed. feedback captured.\n");
    output.write(`${reviewFeedback}\n`);

    const misses = parseReviewMisses(reviewOut);
    output.write(
      `[forge] parsed misses: ${FALLBACK_PATCH_ORDER.map((k) => `${k}=${(misses[k] || []).length}`).join(", ")}\n`,
    );
    const patchResult = patchGeneratedForMisses(root, misses, analysisData);
    if (patchResult.changed) {
      output.write("[forge] local deterministic patch applied.\n");
      for (const file of patchResult.touched) {
        output.write(`- patched: ${file}\n`);
      }
    } else if (agentFailed) {
      output.write(
        "[forge] no local patch candidates found after agent failure.\n"
      );
    } else if (mode === "local" && !usedAgent) {
      output.write("[forge] NEEDS_INPUT\n");
      output.write("- docs:review の失敗原因を解消するための追加情報が必要です。\n");
      const lines = summarizeNeedsInput(reviewOut);
      for (const line of lines) {
        output.write(`- ${line}\n`);
      }
      process.exitCode = 2;
      return;
    }
  }

  throw new Error("forge: max runs reached but review still failing.");
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

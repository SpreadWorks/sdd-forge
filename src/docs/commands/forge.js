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
import { execFile } from "child_process";
import { stdout as output } from "process";
import { fileURLToPath } from "url";
import { populateFromAnalysis } from "./data.js";
import { textFillFromAnalysis } from "./text.js";
import { PKG_DIR, repoRoot, parseArgs } from "../../lib/cli.js";
import { loadJsonFile, loadConfig, loadUiLang, sddOutputDir, saveContext } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { createResolver } from "../lib/resolver-factory.js";
import { callAgentAsync, LONG_AGENT_TIMEOUT_MS } from "../../lib/agent.js";
import { createI18n } from "../../lib/i18n.js";
import {
  summaryToText,
  buildForgeSystemPrompt,
  buildForgeFilePrompt,
  buildForgePrompt,
  buildContextUpdatePrompt,
} from "../lib/forge-prompts.js";
import {
  FALLBACK_PATCH_ORDER,
  summarizeReview,
  parseReviewMisses,
  patchGeneratedForMisses,
  summarizeNeedsInput,
} from "../lib/review-parser.js";

const DEFAULT_AGENT_TIMEOUT_MS = LONG_AGENT_TIMEOUT_MS;
const DEFAULT_WAIT_LOG_SEC = 1;
const DEFAULT_MAX_RUNS = 3;
const DEFAULT_REVIEW_CMD = "sdd-forge review";
const DEFAULT_MODE = "local";
const DEFAULT_CONCURRENCY = 5;

function getTargetFiles(root) {
  const docsDir = path.join(root, "docs");
  if (!fs.existsSync(docsDir)) return [];
  return fs.readdirSync(docsDir)
    .filter((f) => /^\d{2}_.*\.md$/.test(f))
    .sort()
    .map((f) => `docs/${f}`);
}

function readText(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function resolveAgent(cfg, role, cliAgent) {
  const providerKey = cliAgent || cfg.defaultAgent;
  if (cfg.providers?.[providerKey]) {
    return cfg.providers[providerKey];
  }
  return null;
}

function loadAnalysisData(root) {
  const p = path.join(sddOutputDir(root), "analysis.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (_) {
    return null;
  }
}

function loadSummaryData(root) {
  const p = path.join(sddOutputDir(root), "summary.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (_) {
    return null;
  }
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
  const tu = createI18n(loadUiLang(repoRoot(import.meta.url)));
  const h = tu.raw("help.cmdHelp.forge");
  const o = h.options;
  output.write(
    [
      h.usage, "", "Options:",
      `  ${o.prompt}`, `  ${o.promptFile}`, `  ${o.spec}`, `  ${o.maxRuns}`,
      `  ${o.reviewCmd}`, `  ${o.agent}`, `  ${o.mode}`, `  ${o.dryRun}`,
      `  ${o.autoUpdateContext}`, `  ${o.verbose}`, `  ${o.help}`,
      "", "Per-file mode:", `  ${h.perFileNote}`, "",
    ].join("\n")
  );
}

/**
 * コマンド文字列をコマンドと引数に分割して execFile で実行する。
 * bash に依存しない。
 */
function runCommand(cmdString, cwd) {
  const parts = cmdString.match(/"[^"]*"|'[^']*'|\S+/g) || [];
  const command = parts[0];
  const args = parts.slice(1).map((s) => s.replace(/^["']|["']$/g, ""));
  return new Promise((resolve) => {
    execFile(
      command,
      args,
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

/**
 * Thin wrapper around callAgentAsync that adds forge-specific UI:
 * label logging and a progress ticker.
 */
async function invokeAgent(agent, prompt, { cwd, timeoutMs, systemPrompt, verbose, label }) {
  const timeout = timeoutMs || Number(agent?.timeoutMs) || DEFAULT_AGENT_TIMEOUT_MS;
  const displayLabel = label || agent?.name || agent?.command || "agent";

  output.write(`[agent] ${displayLabel} started (timeout: ${Math.floor(timeout / 1000)}s)\n`);

  const ticker = !verbose
    ? setInterval(() => output.write("."), DEFAULT_WAIT_LOG_SEC * 1000)
    : null;

  try {
    return await callAgentAsync(agent, prompt, timeout, cwd, {
      systemPrompt,
      onStdout: verbose ? (chunk) => output.write(chunk) : undefined,
      onStderr: verbose ? (chunk) => output.write(chunk) : undefined,
    });
  } finally {
    if (ticker) clearInterval(ticker);
  }
}

/**
 * Run agent for each file with concurrency control.
 * Returns an array of { file, ok, error? } results.
 */
async function runPerFile({ agent, targetFiles, systemPrompt, lang, round, maxRuns, reviewFeedback, root, timeoutMs, concurrency, verbose }) {
  const results = [];
  let running = 0;
  let idx = 0;

  return new Promise((resolve) => {
    function next() {
      // All dispatched and all done
      if (idx >= targetFiles.length && running === 0) {
        resolve(results);
        return;
      }

      // Dispatch up to concurrency limit
      while (running < concurrency && idx < targetFiles.length) {
        const file = targetFiles[idx++];
        running++;

        const filePrompt = buildForgeFilePrompt({
          lang,
          targetFile: file,
          round,
          maxRuns,
          reviewFeedback,
        });

        output.write(`[forge] start: ${file}\n`);

        invokeAgent(agent, filePrompt, {
          label: `forge:${path.basename(file)}`,
          cwd: root,
          timeoutMs,
          verbose,
          systemPrompt,
        })
          .then(() => {
            output.write(`[forge] done: ${file}\n`);
            results.push({ file, ok: true });
          })
          .catch((e) => {
            output.write(`[forge] failed: ${file} — ${String(e.message || e).slice(0, 200)}\n`);
            results.push({ file, ok: false, error: e.message });
          })
          .finally(() => {
            running--;
            next();
          });
      }
    }

    next();
  });
}

/**
 * forge の review 成功後に projectContext を自動更新する。
 * docs/ の各章ファイル先頭を LLM に渡し、プロジェクト概要を生成させる。
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

  const promptText = buildContextUpdatePrompt({ lang: cfg.lang, snippets });

  let generated;
  try {
    generated = await invokeAgent(agent, promptText, {
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
  const lang = cfg.lang || "ja";
  const t = createI18n(cfg.uiLang || "en", { domain: "messages" });
  const agent = resolveAgent(cfg, "docsForge", cli.agent);
  const mode = cli.mode || DEFAULT_MODE;
  const timeoutMs = Number(cfg.limits?.designTimeoutMs || 0) || undefined;

  if (mode === "agent" && !agent) {
    throw new Error(
      "forge: --mode=agent requires config.json agents.docsForge or providers",
    );
  }

  const analysisData = loadAnalysisData(root);
  const analysisSummary = summaryToText(loadSummaryData(root) || analysisData);
  if (analysisData && !cli.dryRun) {
    output.write("[forge] analysis data loaded.\n");
    const type = resolveType(cfg.type || "");
    let resolveFn = null;
    try {
      const resolver = await createResolver(type, root);
      resolveFn = (category, analysis) => resolver.resolve(category, analysis);
    } catch (err) {
      output.write(`[forge] WARN: resolver not available (${err.message}), skipping {{data}} population\n`);
    }
    const populateResult = populateFromAnalysis(root, analysisData, resolveFn);
    if (populateResult.populated) {
      output.write(`[forge] populated placeholders in: ${populateResult.files.join(", ")}\n`);
    }
    if (agent) {
      const tfResult = await textFillFromAnalysis(root, analysisData, cli.agent);
      if (tfResult.filled > 0) {
        output.write(`[forge] {{text}}: ${tfResult.filled} directives resolved\n`);
      }
    }
  } else if (analysisData && cli.dryRun) {
    output.write("[forge] DRY-RUN: skipping {{data}} population and {{text}} fill\n");
  }

  let userPrompt = String(cli.prompt || "").trim();
  if (!userPrompt && cli.promptFile) {
    userPrompt = readText(path.resolve(root, cli.promptFile)).trim();
  }
  if (!userPrompt) {
    throw new Error(t("forge.promptRequired"));
  }
  let specPath = "";
  let specText = "";
  if (cli.spec) {
    specPath = path.resolve(root, cli.spec);
    if (!fs.existsSync(specPath)) {
      throw new Error(t("forge.specNotFound", { path: specPath }));
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

  const concurrency = Number(cfg.limits?.concurrency || 0) || DEFAULT_CONCURRENCY;

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
        const targetFiles = getTargetFiles(root);
        const usePerFile = !!agent.systemPromptFlag;

        if (usePerFile) {
          // Per-file async processing with system prompt separation
          const systemPrompt = buildForgeSystemPrompt({
            lang,
            userPrompt,
            specPath: specPath ? path.relative(root, specPath) : "",
            specText,
            analysisSummary,
          });

          output.write(`[forge] per-file mode: ${targetFiles.length} files, concurrency=${concurrency}\n`);

          const results = await runPerFile({
            agent,
            targetFiles,
            systemPrompt,
            lang,
            round,
            maxRuns: effectiveMaxRuns,
            reviewFeedback,
            root,
            timeoutMs,
            concurrency,
            verbose: cli.verbose,
          });

          const succeeded = results.filter((r) => r.ok).length;
          const failed = results.filter((r) => !r.ok).length;
          output.write(`[forge] per-file done: ${succeeded} ok, ${failed} failed\n`);

          if (succeeded > 0) usedAgent = true;
          if (failed > 0 && succeeded === 0) agentFailed = true;
        } else {
          // Single-call mode: all files in one prompt (agent lacks systemPromptFlag)
          const prompt = buildForgePrompt({
            lang,
            userPrompt,
            round,
            maxRuns: effectiveMaxRuns,
            reviewFeedback,
            specPath: specPath ? path.relative(root, specPath) : "",
            specText,
            analysisSummary,
            targetFiles,
          });
          try {
            await invokeAgent(agent, prompt, {
              label: "forge.generate",
              cwd: root,
              timeoutMs,
              verbose: cli.verbose,
            });
            usedAgent = true;
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
    }

    // docs/ を直接編集するため generate ステップは不要

    const review = await runCommand(cli.reviewCmd, root);
    output.write(`[forge] review: ${review.ok ? "ok" : "failed"} (code=${review.code})\n`);
    if (review.ok) {
      output.write("[forge] review passed.\n");
      if (cfg.documentStyle && agent) {
        await maybeUpdateContext(root, cfg, agent, timeoutMs, cli.autoUpdateContext);
      }
      const readme = await runCommand(`node "${path.join(PKG_DIR, "docs", "commands", "readme.js")}"`, root);
      output.write(`[forge] README.md ${readme.ok ? "updated" : "update failed"}.\n`);

      // Multi-language: update non-default languages after review pass
      try {
        const { resolveOutputConfig } = await import("../../lib/types.js");
        const outputCfg = resolveOutputConfig(cfg);
        if (outputCfg.isMultiLang) {
          const nonDefaultLangs = outputCfg.languages.filter((l) => l !== outputCfg.default);
          if (outputCfg.mode === "translate") {
            output.write(`[forge] Re-translating to: ${nonDefaultLangs.join(", ")}\n`);
            const translateCmd = `node "${path.join(PKG_DIR, "docs", "commands", "translate.js")}" --force`;
            await runCommand(translateCmd, root);
          }
          // In generate mode, non-default langs would need separate forge runs
          // which is out of scope for this iteration
        }
      } catch (_) {
        // multi-lang not configured — skip
      }

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
      output.write(t("forge.needsInput") + "\n");
      output.write(t("forge.reviewFeedback") + "\n");
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

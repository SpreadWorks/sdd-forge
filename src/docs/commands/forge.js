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
import { execFile } from "child_process";
import { runIfDirect } from "../../lib/entrypoint.js";
import { populateFromAnalysis } from "./data.js";
import { textFillFromAnalysis } from "./text.js";
import { mapWithConcurrency } from "../lib/concurrency.js";
import { PKG_DIR, repoRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig, loadLang, resolveConcurrency } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { loadFullAnalysis, loadAnalysisData, getChapterFiles, readText } from "../lib/command-context.js";
import { createResolver } from "../lib/resolver-factory.js";
import { callAgentAsync, LONG_AGENT_TIMEOUT_MS, resolveAgent } from "../../lib/agent.js";
import { createI18n } from "../../lib/i18n.js";
import {
  summaryToText,
  buildForgeSystemPrompt,
  buildForgeFilePrompt,
  buildForgePrompt,
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

function getTargetFiles(root) {
  const docsDir = path.join(root, "docs");
  return getChapterFiles(docsDir).map((f) => `docs/${f}`);
}

function parseCliOptions(argv) {
  const opts = parseArgs(argv, {
    flags: ["--verbose", "--dry-run"],
    options: ["--prompt", "--prompt-file", "--spec", "--max-runs", "--review-cmd", "--agent", "--mode"],
    aliases: { "-v": "--verbose" },
    defaults: {
      prompt: "",
      promptFile: "",
      spec: "",
      agent: "",
      verbose: false,
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
  const tu = createI18n(loadLang(repoRoot(import.meta.url)));
  const h = tu.raw("help.cmdHelp.forge");
  const o = h.options;
  console.log(
    [
      h.usage, "", "Options:",
      `  ${o.prompt}`, `  ${o.promptFile}`, `  ${o.spec}`, `  ${o.maxRuns}`,
      `  ${o.reviewCmd}`, `  ${o.agent}`, `  ${o.mode}`, `  ${o.dryRun}`,
      `  ${o.verbose}`, `  ${o.help}`,
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

  console.log(`[agent] ${displayLabel} started (timeout: ${Math.floor(timeout / 1000)}s)`);

  const ticker = !verbose
    ? setInterval(() => process.stderr.write("."), DEFAULT_WAIT_LOG_SEC * 1000)
    : null;

  try {
    return await callAgentAsync(agent, prompt, timeout, cwd, {
      systemPrompt,
      onStdout: verbose ? (chunk) => process.stderr.write(chunk) : undefined,
      onStderr: verbose ? (chunk) => process.stderr.write(chunk) : undefined,
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
  const raw = await mapWithConcurrency(targetFiles, concurrency, async (file) => {
    const filePrompt = buildForgeFilePrompt({
      lang,
      targetFile: file,
      round,
      maxRuns,
      reviewFeedback,
    });

    console.log(`[forge] start: ${file}`);

    await invokeAgent(agent, filePrompt, {
      label: `forge:${path.basename(file)}`,
      cwd: root,
      timeoutMs,
      verbose,
      systemPrompt,
    });

    console.log(`[forge] done: ${file}`);
    return { file, ok: true };
  });

  return raw.map((r, i) => {
    if (r.error) {
      const file = targetFiles[i];
      console.log(`[forge] failed: ${file} — ${String(r.error.message || r.error).slice(0, 200)}`);
      return { file, ok: false, error: r.error.message };
    }
    return r.value;
  });
}

async function main() {
  const cli = parseCliOptions(process.argv.slice(2));
  if (cli.help) {
    printHelp();
    return;
  }

  const root = repoRoot(import.meta.url);
  const config = loadConfig(root);
  const lang = config.output.default;
  const t = createI18n(config.lang, { domain: "messages" });
  const agent = resolveAgent(config, cli.agent);
  const mode = cli.mode || DEFAULT_MODE;
  const timeoutMs = Number(config.limits?.designTimeoutMs || 0) || undefined;

  if (mode === "agent" && !agent) {
    throw new Error(
      "forge: --mode=agent requires a configured provider (defaultAgent or --agent)",
    );
  }

  const analysisData = loadFullAnalysis(root);
  const analysisSummary = summaryToText(analysisData);
  if (analysisData && !cli.dryRun) {
    console.log("[forge] analysis data loaded.");
    const type = resolveType(config.type || "");
    let resolveFn = null;
    try {
      const resolver = await createResolver(type, root);
      resolveFn = (category, analysis) => resolver.resolve(category, analysis);
    } catch (err) {
      console.log(`[forge] WARN: resolver not available (${err.message}), skipping {{data}} population`);
    }
    const populateResult = populateFromAnalysis(root, analysisData, resolveFn);
    if (populateResult.populated) {
      console.log(`[forge] populated placeholders in: ${populateResult.files.join(", ")}`);
    }
    if (agent) {
      const tfResult = await textFillFromAnalysis(root, analysisData, cli.agent);
      if (tfResult.filled > 0) {
        console.log(`[forge] {{text}}: ${tfResult.filled} directives resolved`);
      }
    }
  } else if (analysisData && cli.dryRun) {
    console.log("[forge] DRY-RUN: skipping {{data}} population and {{text}} fill");
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

  console.log(
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
    console.log("[forge] DRY-RUN: target files:");
    for (const f of getTargetFiles(root)) {
      console.log(`  - ${f}`);
    }
    console.log("[forge] DRY-RUN: no files written, no review, no agent calls.");
    console.log("\n=== DONE (dry-run) ===");
    return;
  }

  const concurrency = resolveConcurrency(config);

  let reviewFeedback = "";
  for (let round = 1; round <= effectiveMaxRuns; round += 1) {
    console.log(`\n[forge] round ${round}/${effectiveMaxRuns}`);
    console.log(`[forge] run mode=${mode} review='${cli.reviewCmd}'`);
    let usedAgent = false;
    let agentFailed = false;
    if (mode === "assist" || mode === "agent") {
      if (!agent) {
        if (mode === "assist") {
          console.log("[forge] assist mode: agent not configured, run local-only.");
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

          console.log(`[forge] per-file mode: ${targetFiles.length} files, concurrency=${concurrency}`);

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
          console.log(`[forge] per-file done: ${succeeded} ok, ${failed} failed`);

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
            console.log(
              `[forge] agent step failed. continue with local pipeline.\n${String(
                e instanceof Error ? e.message : e
              ).slice(0, 500)}`,
            );
          }
        }
      }
    }

    // docs/ を直接編集するため generate ステップは不要

    const review = await runCommand(cli.reviewCmd, root);
    console.log(`[forge] review: ${review.ok ? "ok" : "failed"} (code=${review.code})`);
    if (review.ok) {
      console.log("[forge] review passed.");
      const readme = await runCommand(`node "${path.join(PKG_DIR, "docs", "commands", "readme.js")}"`, root);
      console.log(`[forge] README.md ${readme.ok ? "updated" : "update failed"}.`);

      // Multi-language: update non-default languages after review pass
      try {
        const { resolveOutputConfig } = await import("../../lib/types.js");
        const outputCfg = resolveOutputConfig(config);
        if (outputCfg.isMultiLang) {
          const nonDefaultLangs = outputCfg.languages.filter((l) => l !== outputCfg.default);
          if (outputCfg.mode === "translate") {
            console.log(`[forge] Re-translating to: ${nonDefaultLangs.join(", ")}`);
            const translateCmd = `node "${path.join(PKG_DIR, "docs", "commands", "translate.js")}" --force`;
            await runCommand(translateCmd, root);
          }
          // In generate mode, non-default langs would need separate forge runs
          // which is out of scope for this iteration
        }
      } catch (_) {
        // multi-lang not configured — skip
      }

      console.log("\n=== DONE ===\n- forge completed");
      return;
    }

    const reviewOut = `${review.stdout}\n${review.stderr}`;
    reviewFeedback = summarizeReview(reviewOut);
    console.log("[forge] review failed. feedback captured.");
    console.log(reviewFeedback);

    const misses = parseReviewMisses(reviewOut);
    console.log(
      `[forge] parsed misses: ${FALLBACK_PATCH_ORDER.map((k) => `${k}=${(misses[k] || []).length}`).join(", ")}`,
    );
    const patchResult = patchGeneratedForMisses(root, misses, analysisData);
    if (patchResult.changed) {
      console.log("[forge] local deterministic patch applied.");
      for (const file of patchResult.touched) {
        console.log(`- patched: ${file}`);
      }
    } else if (agentFailed) {
      console.log(
        "[forge] no local patch candidates found after agent failure."
      );
    } else if (mode === "local" && !usedAgent) {
      console.log(t("forge.needsInput"));
      console.log(t("forge.reviewFeedback"));
      const lines = summarizeNeedsInput(reviewOut);
      for (const line of lines) {
        console.log(`- ${line}`);
      }
      process.exitCode = 2;
      return;
    }
  }

  throw new Error("forge: max runs reached but review still failing.");
}

export { main };

runIfDirect(import.meta.url, main);

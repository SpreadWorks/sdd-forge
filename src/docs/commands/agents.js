#!/usr/bin/env node
/**
 * src/docs/commands/agents.js
 *
 * AGENTS.md を更新する。
 * AGENTS.md 内の {{data: agents.sdd}} / {{data: agents.project}} ディレクティブを解決し、
 * PROJECT セクションは AI で精査する。
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadLang, sddOutputDir, resolveProjectContext } from "../../lib/config.js";
import { callAgent, loadAgentConfig, MID_AGENT_TIMEOUT_MS } from "../../lib/agent.js";
import { createI18n } from "../../lib/i18n.js";
import { createResolver } from "../lib/resolver-factory.js";
import { createLogger } from "../../lib/progress.js";
import { parseDirectives, replaceBlockDirective, resolveDataDirectives } from "../lib/directive-parser.js";
import { resolveCommandContext, loadFullAnalysis, loadAnalysisData } from "../lib/command-context.js";

const logger = createLogger("agents");

// ---------------------------------------------------------------------------
// AI プロンプト構築
// ---------------------------------------------------------------------------

function buildAgentsSystemPrompt(lang) {
  const t = createI18n(lang || "ja", { domain: "prompts" });
  const rules = t.raw("agents.outputRules") || [];
  return [
    t("agents.systemPrompt"),
    "",
    "## Output Rules (strict)",
    ...rules.map((r) => `- ${r}`),
  ].join("\n");
}

function buildRefinePrompt(projectContent, summary, config, srcRoot, sddContent) {
  const parts = [];

  if (sddContent) {
    parts.push("## SDD Section (already present — do not duplicate)");
    parts.push(sddContent);
    parts.push("");
  }

  parts.push("## Current PROJECT Section (template-generated)");
  parts.push(projectContent);
  parts.push("");

  if (config.type) {
    parts.push("## Project Config");
    parts.push(`- type: ${config.type}`);
    const ctx = resolveProjectContext(repoRoot());
    if (ctx) parts.push(`- context: ${ctx}`);
    parts.push("");
  }

  const pkgPath = path.join(srcRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.scripts) {
        parts.push("## package.json scripts");
        parts.push(JSON.stringify(pkg.scripts, null, 2));
        parts.push("");
      }
    } catch (_) { /* skip */ }
  }

  parts.push("## Analysis Summary");
  parts.push(JSON.stringify(summary, null, 2));

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// ディレクティブ解決
// ---------------------------------------------------------------------------

/**
 * AGENTS.md 内の {{data}} ディレクティブを解決する。
 * agents.project ディレクティブの解決結果を返す（AI 精査用）。
 */
function resolveAgentsDirectives(text, resolveFn) {
  let sddContent = null;
  let projectContent = null;

  const result = resolveDataDirectives(
    text,
    (source, method, labels) => resolveFn(source, method, {}, labels),
    {
      onResolve(d, rendered) {
        if (d.source === "agents" && d.method === "sdd") sddContent = rendered;
        if (d.source === "agents" && d.method === "project") projectContent = rendered;
      },
    },
  );

  return { text: result.text, sddContent, projectContent };
}

/**
 * AI 精査後の PROJECT セクションで、ディレクティブ内部を差し替える。
 */
function replaceProjectContent(text, refined) {
  const directives = parseDirectives(text);
  const lines = text.split("\n");

  for (let i = directives.length - 1; i >= 0; i--) {
    const d = directives[i];
    if (d.type !== "data" || d.source !== "agents" || d.method !== "project") continue;
    if (d.endLine < 0) continue;

    replaceBlockDirective(lines, d, refined);
    break;
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(ctx) {
  if (!ctx) {
    const cli = parseArgs(process.argv.slice(2), {
      flags: ["--dry-run"],
      options: [],
      defaults: { dryRun: false },
    });

    if (cli.help) {
      const tu = createI18n(loadLang(repoRoot()));
      const h = tu.raw("help.cmdHelp.agents");
      const o = h.options;
      console.log([
        h.usage, "", `  ${h.desc}`, `  ${h.descDetail}`, "", "Options:",
        `  ${o.dryRun}`,
      ].join("\n"));
      return;
    }

    ctx = resolveCommandContext(cli);
    ctx.dryRun = cli.dryRun;
  }

  const { root, srcRoot, config, lang, t } = ctx;

  const agentsPath = path.join(srcRoot, "AGENTS.md");
  if (!fs.existsSync(agentsPath)) {
    throw new Error(t("agents.notFound", { path: agentsPath }));
  }

  // Load analysis
  const analysis = loadFullAnalysis(root);
  if (!analysis) {
    throw new Error(t("agents.analysisNotFound", { path: path.join(sddOutputDir(root), "analysis.json") }));
  }
  const summary = loadAnalysisData(root);

  // Create resolver and resolve {{data}} directives
  const resolvedType = config.type || "base";
  const resolver = await createResolver(resolvedType, root);
  const resolveFn = (source, method, a, labels) => resolver.resolve(source, method, analysis, labels);

  let content = fs.readFileSync(agentsPath, "utf8");
  const { text: resolved, sddContent, projectContent } = resolveAgentsDirectives(content, resolveFn);
  content = resolved;

  // AI refinement for PROJECT section
  if (projectContent) {
    const agent = loadAgentConfig(config);

    logger.log(t("agents.refining"));
    const systemPrompt = buildAgentsSystemPrompt(lang);
    const prompt = buildRefinePrompt(projectContent, summary, config, srcRoot, sddContent);

    try {
      const result = callAgent(agent, prompt, MID_AGENT_TIMEOUT_MS, undefined, { systemPrompt });

      let refined = result.trim();

      content = replaceProjectContent(content, refined);
    } catch (err) {
      throw new Error(`AI agent call failed: ${err.message}`);
    }

    logger.log(t("agents.generated"));
  }

  if (ctx.dryRun) {
    logger.log(t("agents.dryRun", { path: agentsPath }));
    console.log(content);
    return;
  }

  fs.writeFileSync(agentsPath, content, "utf8");
  console.log(t("agents.updated", { path: agentsPath }));
}

export { main };

runIfDirect(import.meta.url, main);

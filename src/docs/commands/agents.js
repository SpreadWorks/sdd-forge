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
import { parseArgs } from "../../lib/cli.js";
import { sddOutputDir } from "../../lib/config.js";
import { callAgent, loadAgentConfig, LONG_AGENT_TIMEOUT_MS } from "../../lib/agent.js";
import { translate } from "../../lib/i18n.js";
import { createResolver } from "../lib/resolver-factory.js";
import { createLogger } from "../../lib/progress.js";
import { parseDirectives, replaceBlockDirective, resolveDataDirectives } from "../lib/directive-parser.js";
import { resolveCommandContext, loadFullAnalysis, getChapterFiles, readText } from "../lib/command-context.js";

const logger = createLogger("agents");

// ---------------------------------------------------------------------------
// AI プロンプト構築
// ---------------------------------------------------------------------------

function buildAgentsSystemPrompt() {
  const t = translate();
  const rules = t.raw("prompts:agents.outputRules") || [];
  return [
    t("prompts:agents.systemPrompt"),
    "",
    "## Output Rules (strict)",
    ...rules.map((r) => `- ${r}`),
  ].join("\n");
}

function buildRefinePrompt(projectContent, docsContent, config, srcRoot, sddContent) {
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

  if (docsContent) {
    parts.push("## Generated Documentation");
    parts.push(docsContent);
  }

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
      const tu = translate();
      const h = tu.raw("ui:help.cmdHelp.agents");
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
    throw new Error(t("messages:agents.notFound", { path: agentsPath }));
  }

  // Load analysis
  const analysis = loadFullAnalysis(root);
  if (!analysis) {
    throw new Error(t("messages:agents.analysisNotFound", { path: path.join(sddOutputDir(root), "analysis.json") }));
  }

  // Load generated docs as context (instead of raw analysis.json)
  const docsDir = path.join(root, "docs");
  const chapterFiles = getChapterFiles(docsDir);
  const docsContent = chapterFiles.map((f) => readText(path.join(docsDir, f))).join("\n\n");
  const readmeContent = readText(path.join(srcRoot, "README.md"));
  const combinedDocs = [docsContent, readmeContent].filter(Boolean).join("\n\n---\n\n");

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

    logger.log(t("messages:agents.refining"));
    const systemPrompt = buildAgentsSystemPrompt();
    const prompt = buildRefinePrompt(projectContent, combinedDocs, config, srcRoot, sddContent);

    try {
      const result = callAgent(agent, prompt, LONG_AGENT_TIMEOUT_MS, undefined, { systemPrompt });

      let refined = result.trim();

      content = replaceProjectContent(content, refined);
    } catch (err) {
      throw new Error(`AI agent call failed: ${err.message}`);
    }

    logger.log(t("messages:agents.generated"));
  }

  if (ctx.dryRun) {
    logger.log(t("messages:agents.dryRun", { path: agentsPath }));
    console.log(content);
    return;
  }

  fs.writeFileSync(agentsPath, content, "utf8");
  console.log(t("messages:agents.updated", { path: agentsPath }));
}

export { main };

runIfDirect(import.meta.url, main);

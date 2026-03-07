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
import { fileURLToPath } from "url";
import { PKG_DIR, sourceRoot, repoRoot, parseArgs } from "../../lib/cli.js";
import { loadJsonFile, loadUiLang, sddConfigPath, sddOutputDir, resolveProjectContext } from "../../lib/config.js";
import { callAgent, loadAgentConfig } from "../../lib/agent.js";
import { createI18n } from "../../lib/i18n.js";
import { createResolver } from "../lib/resolver-factory.js";
import { parseDirectives } from "../lib/directive-parser.js";

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
  const directives = parseDirectives(text);
  if (directives.length === 0) return { text, sddContent: null, projectContent: null };

  const lines = text.split("\n");
  let sddContent = null;
  let projectContent = null;

  // 後ろから処理
  for (let i = directives.length - 1; i >= 0; i--) {
    const d = directives[i];
    if (d.type !== "data") continue;

    const rendered = resolveFn(d.source, d.method, {}, d.labels);
    if (rendered === null || rendered === undefined) continue;

    // Track sdd/project content
    if (d.source === "agents" && d.method === "sdd") sddContent = rendered;
    if (d.source === "agents" && d.method === "project") projectContent = rendered;

    if (d.endLine >= 0) {
      const endDataLine = lines[d.endLine];
      const newLines = [d.raw, rendered, endDataLine];
      lines.splice(d.line, d.endLine - d.line + 1, ...newLines);
    }
  }

  return { text: lines.join("\n"), sddContent, projectContent };
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

    const endDataLine = lines[d.endLine];
    const newLines = [d.raw, refined, endDataLine];
    lines.splice(d.line, d.endLine - d.line + 1, ...newLines);
    break;
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args, {
    flags: ["--dry-run"],
    options: [],
    defaults: { dryRun: false },
  });

  if (opts.help) {
    const tu = createI18n(loadUiLang(repoRoot()));
    const h = tu.raw("help.cmdHelp.agents");
    const o = h.options;
    console.log([
      h.usage, "", `  ${h.desc}`, `  ${h.descDetail}`, "", "Options:",
      `  ${o.dryRun}`,
    ].join("\n"));
    process.exit(0);
  }

  const workRoot = repoRoot();
  const srcRoot = sourceRoot();

  let config = {};
  try {
    config = loadJsonFile(sddConfigPath(workRoot));
  } catch (_) {}

  const lang = config.lang || config.output?.default || "en";
  const t = createI18n(config.uiLang || "en", { domain: "messages" });

  const agentsPath = path.join(srcRoot, "AGENTS.md");
  if (!fs.existsSync(agentsPath)) {
    console.error(t("agents.notFound", { path: agentsPath }));
    process.exit(1);
  }

  // Load analysis
  const outputDir = sddOutputDir(workRoot);
  const analysisPath = path.join(outputDir, "analysis.json");
  let analysis;
  try {
    analysis = loadJsonFile(analysisPath);
  } catch (err) {
    console.error(t("agents.analysisNotFound", { path: analysisPath }));
    process.exit(1);
  }

  const summaryPath = path.join(outputDir, "summary.json");
  let summary;
  try {
    summary = loadJsonFile(summaryPath);
  } catch (_) {
    summary = analysis;
  }

  // Create resolver and resolve {{data}} directives
  const resolvedType = config.type || "base";
  const resolver = await createResolver(resolvedType, workRoot);
  const resolveFn = (source, method, a, labels) => resolver.resolve(source, method, analysis, labels);

  let content = fs.readFileSync(agentsPath, "utf8");
  const { text: resolved, sddContent, projectContent } = resolveAgentsDirectives(content, resolveFn);
  content = resolved;

  // AI refinement for PROJECT section
  if (projectContent) {
    let agent;
    try {
      agent = loadAgentConfig(config);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }

    console.error(t("agents.refining"));
    const systemPrompt = buildAgentsSystemPrompt(lang);
    const prompt = buildRefinePrompt(projectContent, summary, config, srcRoot, sddContent);

    try {
      const result = callAgent(agent, prompt, 180000, undefined, { systemPrompt });

      // Extract the refined content (AI may wrap in tags or return plain)
      let refined = result;
      // Strip any leftover section markers from AI output
      refined = refined
        .replace(/^<!-- PROJECT:START[^>]*-->\n?/gm, "")
        .replace(/<!-- PROJECT:END -->\n?/gm, "")
        .trim();

      content = replaceProjectContent(content, refined);
    } catch (err) {
      console.error(`Error: AI agent call failed: ${err.message}`);
      process.exit(1);
    }

    console.error(t("agents.generated"));
  }

  if (opts.dryRun) {
    console.error(t("agents.dryRun", { path: agentsPath }));
    process.stdout.write(content);
    return;
  }

  fs.writeFileSync(agentsPath, content, "utf8");
  console.log(t("agents.updated", { path: agentsPath }));
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main().catch((err) => { console.error(`Error: ${err.message}`); process.exit(1); });
}

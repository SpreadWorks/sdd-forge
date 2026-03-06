#!/usr/bin/env node
/**
 * src/docs/commands/agents.js
 *
 * AGENTS.md を更新する。
 *   デフォルト: SDD テンプレ差し替え + PROJECT テンプレ生成 → AI 精査・追記
 *   --sdd:     SDD セクションのみテンプレートで差し替え（AI なし）
 *   --project: PROJECT テンプレ生成 → AI 精査・追記
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sourceRoot, repoRoot, parseArgs } from "../../lib/cli.js";
import { loadJsonFile, loadConfig, resolveProjectContext } from "../../lib/config.js";
import { callAgent } from "../../lib/agent.js";
import { createI18n } from "../../lib/i18n.js";
import { loadSddTemplate, updateSddSection } from "../../lib/agents-md.js";

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// ---------------------------------------------------------------------------
// AI エージェント呼び出し
// ---------------------------------------------------------------------------

function loadAgentConfig(cfg, agentName) {
  const providerKey = agentName || cfg.defaultAgent;
  if (!providerKey) {
    throw new Error("No default agent configured. Set 'defaultAgent' in config.json or run 'sdd-forge setup'.");
  }
  const provider = cfg.providers?.[providerKey];
  if (!provider) {
    throw new Error(`Unknown agent provider: ${providerKey}. Available: ${Object.keys(cfg.providers || {}).join(", ")}`);
  }
  return provider;
}

// ---------------------------------------------------------------------------
// AI プロンプト構築
// ---------------------------------------------------------------------------

/**
 * agents コマンド用のシステムプロンプトを構築する。
 * 出力ルール（PROJECT タグ形式、構造要件）を含む。
 */
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

/**
 * テンプレート出力をベースに AI に精査・追記させるプロンプトを構築する。
 */
function buildRefinePrompt(templateOutput, summary, config, srcRoot, sddSection) {
  const parts = [];

  if (sddSection) {
    parts.push("## SDD Section (already present — do not duplicate)");
    parts.push(sddSection);
    parts.push("");
  }

  parts.push("## Current PROJECT Section (template-generated)");
  parts.push(templateOutput);
  parts.push("");

  // config info
  if (config.type) {
    parts.push("## Project Config");
    parts.push(`- type: ${config.type}`);
    const ctx = resolveProjectContext(repoRoot());
    if (ctx) parts.push(`- context: ${ctx}`);
    parts.push("");
  }

  // package.json scripts
  const pkgPath = path.join(srcRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.scripts) {
        parts.push("## package.json scripts");
        parts.push(JSON.stringify(pkg.scripts, null, 2));
        parts.push("");
      }
    } catch (_) { /* malformed package.json — non-critical, skip scripts section */ }
  }

  // summary.json
  parts.push("## Analysis Summary");
  parts.push(JSON.stringify(summary, null, 2));

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// テンプレートベース PROJECT セクション生成
// ---------------------------------------------------------------------------

function generateProjectSectionTemplate(analysis, config, srcRoot) {
  const lines = [];

  lines.push("<!-- PROJECT:START — managed by sdd-forge. Do not edit manually. -->");
  lines.push("## Project Context");
  lines.push("");
  lines.push(`- generated_at: ${new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC")}`);
  lines.push("");

  if (config.type) {
    lines.push("### Technology Stack");
    lines.push("");
    lines.push(`- type: ${config.type}`);

    if (analysis.extras?.composerDeps?.require) {
      const req = analysis.extras.composerDeps.require;
      if (req.php) lines.push(`- PHP: ${req.php}`);
    }

    const pkgPath = path.join(srcRoot, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.engines?.node) lines.push(`- Node.js: ${pkg.engines.node}`);
      } catch (_) { /* malformed package.json — non-critical, skip engine info */ }
    }

    lines.push("");
  }

  const ctrl = analysis.controllers?.summary;
  const mdl = analysis.models?.summary;
  const sh = analysis.shells?.summary;
  const rt = analysis.routes?.summary;

  if (ctrl || mdl || sh || rt) {
    lines.push("### Structure Summary");
    lines.push("");
    lines.push("| category | count | details |");
    lines.push("| --- | --- | --- |");
    if (ctrl) lines.push(`| Controllers | ${ctrl.total} | ${ctrl.totalActions} actions |`);
    if (mdl) lines.push(`| Models | ${mdl.total} | FE: ${mdl.feModels || 0}, Logic: ${mdl.logicModels || 0} |`);
    if (sh) lines.push(`| Shells | ${sh.total} | ${sh.withMain || 0} with main() |`);
    if (rt) lines.push(`| Routes | ${rt.total} | ${(rt.controllers || []).length} controllers |`);
    lines.push("");
  }

  if (mdl?.dbGroups) {
    const groups = Object.entries(mdl.dbGroups).filter(([, v]) => v.length > 0);
    if (groups.length > 0) {
      lines.push("### Database Groups");
      lines.push("");
      lines.push("| connection | models |");
      lines.push("| --- | --- |");
      for (const [name, models] of groups) {
        lines.push(`| ${name} | ${models.length} |`);
      }
      lines.push("");
    }
  }

  const pkgPath2 = path.join(srcRoot, "package.json");
  if (fs.existsSync(pkgPath2)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath2, "utf8"));
      if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
        lines.push("### Available Commands");
        lines.push("");
        lines.push("| command | script |");
        lines.push("| --- | --- |");
        for (const [name, script] of Object.entries(pkg.scripts)) {
          lines.push(`| \`npm run ${name}\` | ${script.replace(/\|/g, "\\|")} |`);
        }
        lines.push("");
      }
    } catch (_) { /* malformed package.json — non-critical, skip commands table */ }
  }

  lines.push("<!-- PROJECT:END -->");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// AGENTS.md 更新
// ---------------------------------------------------------------------------

function updateProjectSection(filePath, projectSection) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} not found. Run 'sdd-forge setup' first.`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const projectPattern = /<!-- PROJECT:START[^>]*-->[\s\S]*?<!-- PROJECT:END -->/;

  let updated;
  if (projectPattern.test(content)) {
    updated = content.replace(projectPattern, projectSection);
  } else {
    const sddEndPattern = /<!-- SDD:END -->/;
    if (sddEndPattern.test(content)) {
      updated = content.replace(sddEndPattern, `<!-- SDD:END -->\n\n${projectSection}`);
    } else {
      updated = content.trimEnd() + "\n\n" + projectSection + "\n";
    }
  }

  fs.writeFileSync(filePath, updated, "utf8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args, {
    flags: ["--dry-run", "--sdd", "--project"],
    options: [],
    defaults: { dryRun: false, sdd: false, project: false },
  });

  if (opts.help) {
    let uiLang = "en";
    try { uiLang = JSON.parse(fs.readFileSync(path.join(repoRoot(), ".sdd-forge", "config.json"), "utf8")).uiLang || "en"; } catch (_) {}
    const tu = createI18n(uiLang);
    const h = tu.raw("help.cmdHelp.agents");
    const o = h.options;
    console.log([
      h.usage, "", `  ${h.desc}`, `  ${h.descDetail}`, "", "Options:",
      `  ${o.sdd}`, `  ${o.project}`, `  ${o.dryRun}`,
    ].join("\n"));
    process.exit(0);
  }

  const workRoot = repoRoot();
  const srcRoot = sourceRoot();

  // Load config.json (needed for uiLang and lang)
  let config = {};
  try {
    config = loadJsonFile(path.join(workRoot, ".sdd-forge", "config.json"));
  } catch (_) {
    // config is optional for --sdd mode
  }

  const lang = config.lang || config.output?.default || "en";
  const t = createI18n(config.uiLang || "en", { domain: "messages" });

  // Flag logic: --sdd → SDD only, --project → PROJECT only, neither → both
  const updateSdd = opts.sdd || !opts.project;
  const updateProject = opts.project || !opts.sdd;

  const agentsPath = path.join(srcRoot, "AGENTS.md");

  // Load SDD template (needed for both SDD update and PROJECT context)
  const sddSection = loadSddTemplate(lang);

  // --- SDD section ---
  if (updateSdd) {
    if (!sddSection) {
      console.error(t("agents.sddTemplateNotFound"));
      process.exit(1);
    }
    if (opts.dryRun) {
      console.error(t("agents.dryRun", { path: agentsPath }));
      process.stdout.write(sddSection);
      if (updateProject) process.stdout.write("\n\n");
    } else {
      updateSddSection(agentsPath, sddSection);
      console.log(t("agents.sddUpdated", { path: agentsPath }));
    }
  }

  // --- PROJECT section ---
  if (updateProject) {
    const outputDir = path.join(workRoot, ".sdd-forge", "output");

    // Load analysis.json (for template generation)
    const analysisPath = path.join(outputDir, "analysis.json");
    let analysis;
    try {
      analysis = loadJsonFile(analysisPath);
    } catch (err) {
      console.error(t("agents.analysisNotFound", { path: analysisPath }));
      process.exit(1);
    }

    // Load summary.json (for AI prompt — lighter than full analysis)
    const summaryPath = path.join(outputDir, "summary.json");
    let summary;
    try {
      summary = loadJsonFile(summaryPath);
    } catch (_) {
      // fallback: use full analysis if summary not yet generated
      summary = analysis;
    }

    // Generate template skeleton
    const templateOutput = generateProjectSectionTemplate(analysis, config, srcRoot);

    // AI refinement
    let projectSection;
    let agent;
    try {
      agent = loadAgentConfig(config);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }

    console.error(t("agents.refining"));
    const systemPrompt = buildAgentsSystemPrompt(lang);
    const prompt = buildRefinePrompt(templateOutput, summary, config, srcRoot, sddSection);

    try {
      const result = callAgent(agent, prompt, 180000, undefined, { systemPrompt });

      // Extract PROJECT section from AI response
      const projectMatch = result.match(/<!-- PROJECT:START[^>]*-->[\s\S]*?<!-- PROJECT:END -->/);
      if (projectMatch) {
        projectSection = projectMatch[0];
      } else {
        // AI didn't wrap in tags — wrap it
        projectSection = [
          "<!-- PROJECT:START — managed by sdd-forge. Do not edit manually. -->",
          result,
          "<!-- PROJECT:END -->",
        ].join("\n");
      }
    } catch (err) {
      console.error(`Error: AI agent call failed: ${err.message}`);
      process.exit(1);
    }

    console.error(t("agents.generated"));

    if (opts.dryRun) {
      if (!updateSdd) console.error(t("agents.dryRun", { path: agentsPath }));
      process.stdout.write(projectSection + "\n");
    } else {
      updateProjectSection(agentsPath, projectSection);
      console.log(t("agents.updated", { path: agentsPath }));
    }
  }
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  try {
    main();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

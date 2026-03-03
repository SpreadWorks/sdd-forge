#!/usr/bin/env node
/**
 * src/docs/commands/agents.js
 *
 * AGENTS.md を更新する。
 *   デフォルト: AI エージェントで analysis.json を要約し PROJECT セクションを生成
 *   --template: AI を使わずテンプレートベースで生成
 *   --force:    SDD + PROJECT + 空の Guidelines で全体を書き直す
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sourceRoot, repoRoot, parseArgs } from "../../lib/cli.js";
import { loadJsonFile, loadConfig, resolveProjectContext } from "../../lib/config.js";
import { callAgent } from "../../lib/agent.js";

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// ---------------------------------------------------------------------------
// SDD テンプレート読み込み
// ---------------------------------------------------------------------------

function loadSddTemplate(lang) {
  for (const l of [lang, "en"]) {
    const p = path.join(PKG_DIR, "templates", "locale", l, "base", "AGENTS.sdd.md");
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  return "";
}

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
// AI 要約プロンプト構築
// ---------------------------------------------------------------------------

/**
 * agents コマンド用のシステムプロンプトを構築する。
 * 出力ルール（PROJECT タグ形式、構造要件）を含む。
 */
function buildAgentsSystemPrompt() {
  return [
    "以下のソースコード解析データ (analysis.json) を要約し、AGENTS.md の Project Context セクションを生成してください。",
    "",
    "## 出力ルール（厳守）",
    "- <!-- PROJECT:START --> と <!-- PROJECT:END --> タグで囲むこと",
    "- 最初の行は `<!-- PROJECT:START — managed by sdd-forge. Do not edit manually. -->` とすること",
    "- 最後の行は `<!-- PROJECT:END -->` とすること",
    "- `## Project Context` の見出しで始めること",
    "- AI エージェントがプロジェクトを理解するのに役立つ情報を構造的にまとめること",
    "- 技術スタック、プロジェクト構造の概要、主要コンポーネント、DB 構成、利用可能なコマンドを含めること",
    "- マークダウンのテーブルやリストを活用して読みやすくすること",
    "- 前置き・メタコメンタリーは含めないこと",
  ].join("\n");
}

function buildSummaryPrompt(analysis, config, srcRoot) {
  const parts = [];

  // config info
  if (config.type) {
    parts.push(`## プロジェクト設定`);
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
    } catch (_) { /* ignore */ }
  }

  // analysis.json (truncated)
  parts.push("## analysis.json");
  const analysisJson = JSON.stringify(analysis, null, 2);
  if (analysisJson.length > 30000) {
    parts.push(analysisJson.slice(0, 30000));
    parts.push("... (truncated)");
  } else {
    parts.push(analysisJson);
  }

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
      } catch (_) { /* ignore */ }
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
    } catch (_) { /* ignore */ }
  }

  lines.push("<!-- PROJECT:END -->");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// AGENTS.md 更新
// ---------------------------------------------------------------------------

function updateProjectSection(filePath, projectSection) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${filePath} not found. Run 'sdd-forge setup' first.`);
    process.exit(1);
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

function rewriteAgentsMd(filePath, sddSection, projectSection) {
  const parts = [
    sddSection.trim(),
    "",
    projectSection,
    "",
    "## Project Guidelines",
    "",
    "<!-- Add project-specific guidelines here -->",
    "",
  ];
  fs.writeFileSync(filePath, parts.join("\n"), "utf8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args, {
    flags: ["--force", "--template", "--dry-run"],
    options: [],
    defaults: { force: false, template: false, dryRun: false },
  });

  if (opts.help) {
    console.log("Usage: sdd-forge agents [--force] [--template]");
    console.log("");
    console.log("  analysis.json から AGENTS.md を更新する。");
    console.log("  デフォルトで AI エージェントを使用して PROJECT セクションを要約生成する。");
    console.log("");
    console.log("Options:");
    console.log("  --force      AGENTS.md を全体書き直す（SDD + PROJECT + 空の Guidelines）");
    console.log("  --template   AI を使わずテンプレートベースで生成する");
    console.log("  --dry-run    ファイル書き込みせず生成内容を stdout に出力する");
    process.exit(0);
  }

  const workRoot = repoRoot();
  const srcRoot = sourceRoot();

  // Load analysis.json
  const analysisPath = path.join(workRoot, ".sdd-forge", "output", "analysis.json");
  let analysis;
  try {
    analysis = loadJsonFile(analysisPath);
  } catch (err) {
    console.error(`Error: ${analysisPath} not found.`);
    console.error("Run 'sdd-forge scan' first.");
    process.exit(1);
  }

  // Load config.json
  let config = {};
  try {
    config = loadJsonFile(path.join(workRoot, ".sdd-forge", "config.json"));
  } catch (_) {
    // config is optional for template mode
  }

  const lang = config.lang || config.output?.default || "en";

  // Generate PROJECT section
  let projectSection;

  if (opts.template) {
    projectSection = generateProjectSectionTemplate(analysis, config, srcRoot);
    console.error("[agents] template mode: generating from analysis.json without AI");
  } else {
    // AI mode (default)
    let agent;
    try {
      agent = loadAgentConfig(config);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }

    console.error("[agents] generating PROJECT section with AI...");
    const systemPrompt = buildAgentsSystemPrompt();
    const prompt = buildSummaryPrompt(analysis, config, srcRoot);

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

    console.error("[agents] AI summary generated.");
  }

  // Update AGENTS.md
  const agentsPath = path.join(srcRoot, "AGENTS.md");

  if (opts.dryRun) {
    console.error("[agents] DRY-RUN: would update " + agentsPath);
    process.stdout.write(projectSection + "\n");
    return;
  }

  if (opts.force) {
    const sddSection = loadSddTemplate(lang);
    if (!sddSection) {
      console.error("Error: SDD template not found.");
      process.exit(1);
    }
    rewriteAgentsMd(agentsPath, sddSection, projectSection);
    console.log(`[agents] rewrote ${agentsPath}`);
  } else {
    updateProjectSection(agentsPath, projectSection);
    console.log(`[agents] updated PROJECT section in ${agentsPath}`);
  }
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

#!/usr/bin/env node
/**
 * sdd-forge/setup/setup.js
 *
 * Interactive setup wizard.
 * Registers a project and generates .sdd-forge/config.json.
 *
 * Usage:
 *   sdd-forge setup
 *   sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { runIfDirect } from "./lib/entrypoint.js";
import { PKG_DIR, parseArgs } from "./lib/cli.js";
import { validateConfig } from "./lib/types.js";
import { DEFAULT_LANG } from "./lib/config.js";
import { createI18n } from "./lib/i18n.js";
import { PRESETS } from "./lib/presets.js";
import { buildTreeItems, select } from "./lib/multi-select.js";
import { loadSddTemplate } from "./lib/agents-md.js";
import { ensureAgentWorkDir } from "./lib/agent.js";

// ---------------------------------------------------------------------------
// readline helpers
// ---------------------------------------------------------------------------

/**
 * Ask a text input question. Creates a temporary readline interface
 * to avoid state sharing issues with the select widget.
 */
function ask(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseSetupArgs(argv) {
  return parseArgs(argv, {
    flags: ["--dry-run"],
    options: [
      "--name", "--path", "--work-root",
      "--type", "--purpose", "--tone",
      "--agent",
      "--lang",
    ],
    defaults: {
      name: "",
      path: "",
      workRoot: "",
      type: "",
      purpose: "",
      tone: "",
      agent: "",
      lang: "",
      dryRun: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Project registration
// ---------------------------------------------------------------------------

function ensureProjectDirs(workRoot) {
  const sddDir = path.join(workRoot, ".sdd-forge");
  const outputDir = path.join(sddDir, "output");
  const docsDir = path.join(workRoot, "docs");
  const specsDir = path.join(workRoot, "specs");
  [sddDir, outputDir, docsDir, specsDir].forEach((d) =>
    fs.mkdirSync(d, { recursive: true }),
  );
  fs.writeFileSync(path.join(outputDir, ".gitkeep"), "");
}

function ensureGitignore(workRoot) {
  const rootGitignore = path.join(workRoot, ".gitignore");
  const rootEntries = [".tmp", ".sdd-forge/worktree"];
  if (fs.existsSync(rootGitignore)) {
    const lines = fs.readFileSync(rootGitignore, "utf8").split("\n");
    const toAdd = rootEntries.filter((entry) => {
      const has = lines.some((l) => l.trim() === entry);
      const negated = lines.some((l) => l.trim() === `!${entry}`);
      return !has && !negated;
    });
    if (toAdd.length) {
      fs.appendFileSync(rootGitignore, `\n${toAdd.join("\n")}\n`);
    }
  } else {
    fs.writeFileSync(rootGitignore, `${rootEntries.join("\n")}\n`);
  }
}

function registerProject(projectName, sourcePath, workRootPath, t) {
  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(t("common.error.pathNotFound", { path: resolved }));
  }

  const workRoot = workRootPath ? path.resolve(workRootPath) : resolved;
  ensureProjectDirs(workRoot);
  ensureGitignore(workRoot);

  console.log(t("setup.messages.projectRegistered", { name: projectName }));
  console.log(t("setup.messages.sourceDir", { path: resolved }));

  return { workRoot };
}

// ---------------------------------------------------------------------------
// Agent config file (CLAUDE.md / AGENTS.md) setup
// ---------------------------------------------------------------------------

const AGENT_DIRECTIVES = [
  '<!-- {{data: agents.sdd("")}} -->',
  '<!-- {{/data}} -->',
  '',
  '<!-- {{data: agents.project("")}} -->',
  '<!-- {{/data}} -->',
].join("\n");

/**
 * Ensure agent config file has the required data directives.
 * - If file does not exist: create with directives.
 * - If file exists without directives: append directives.
 * - If file exists with directives: leave as-is.
 *
 * @param {string} filePath - Absolute path to the agent config file
 * @param {function} t - i18n function
 */
function ensureAgentConfigFile(filePath, t) {
  const fileName = path.basename(filePath);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, AGENT_DIRECTIVES + "\n", "utf8");
    console.log(t("setup.messages.agentFileCreated", { file: fileName }));
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  if (content.includes("{{data: agents.")) {
    console.log(t("setup.messages.agentFileUpToDate", { file: fileName }));
    return;
  }

  // Append directives to existing file
  const separator = content.endsWith("\n") ? "\n" : "\n\n";
  fs.writeFileSync(filePath, content + separator + AGENT_DIRECTIVES + "\n", "utf8");
  console.log(t("setup.messages.agentFileUpdated", { file: fileName }));
}

/**
 * Setup CLAUDE.md as an independent file (no symlink).
 * If CLAUDE.md is a symlink, replace with real file.
 *
 * @param {string} sourceDir
 */
function fixClaudeMdSymlink(sourceDir) {
  const claudePath = path.join(sourceDir, "CLAUDE.md");
  try {
    const stat = fs.lstatSync(claudePath);
    if (stat.isSymbolicLink()) {
      const content = fs.readFileSync(claudePath, "utf8");
      fs.unlinkSync(claudePath);
      fs.writeFileSync(claudePath, content, "utf8");
    }
  } catch (_) {
    // path doesn't exist — nothing to fix
  }
}

// ---------------------------------------------------------------------------
// Skills setup
// ---------------------------------------------------------------------------

/**
 * Resolve the skill template filename for the given language.
 * Falls back to SKILL.en.md if the language-specific file does not exist.
 */
function resolveSkillFile(skillDir, lang) {
  const langFile = path.join(skillDir, `SKILL.${lang}.md`);
  if (fs.existsSync(langFile)) return langFile;
  const enFile = path.join(skillDir, "SKILL.en.md");
  if (fs.existsSync(enFile)) return enFile;
  return null;
}

/**
 * Deploy skill templates to .agents/skills/ and .claude/skills/.
 */
function setupSkills(workRoot, t, lang) {
  const agentsSkillsDir = path.join(workRoot, ".agents", "skills");
  const claudeSkillsDir = path.join(workRoot, ".claude", "skills");

  const templatesDir = path.join(PKG_DIR, "templates", "skills");
  const skillDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const name of skillDirs) {
    const skillDir = path.join(templatesDir, name);
    const srcFile = resolveSkillFile(skillDir, lang || "en");
    if (!srcFile) continue;

    const agentsDest = path.join(agentsSkillsDir, name);
    fs.mkdirSync(agentsDest, { recursive: true });
    fs.copyFileSync(srcFile, path.join(agentsDest, "SKILL.md"));

    const claudeDest = path.join(claudeSkillsDir, name);
    fs.mkdirSync(claudeDest, { recursive: true });
    fs.copyFileSync(srcFile, path.join(claudeDest, "SKILL.md"));
  }

  console.log(t("setup.messages.skillsDeployed"));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const cli = parseSetupArgs(process.argv.slice(2));

  if (cli.help) {
    const tu = createI18n(cli.lang || DEFAULT_LANG);
    const h = tu.raw("help.cmdHelp.setup");
    const o = h.options;
    console.log([
      h.usage, "", `  ${h.desc}`, "", "Options:",
      `  ${o.name}`, `  ${o.path}`, `  ${o.workRoot}`, `  ${o.type}`,
      `  ${o.purpose}`, `  ${o.tone}`, `  ${o.agent}`,
      `  ${o.lang}`, `  ${o.dryRun}`, `  ${o.help}`,
    ].join("\n"));
    return;
  }

  const defaultPath = process.cwd();
  const defaultName = path.basename(defaultPath);

  // Non-interactive mode: all required values provided via CLI
  const hasAllRequired = cli.name && cli.type && cli.purpose && cli.tone;

  let projectName = cli.name;
  let sourcePath = cli.path || defaultPath;
  let workRootPath = cli.workRoot || "";
  let operatingLang = cli.lang || DEFAULT_LANG;
  let outputLangs = [];
  let outputDefault = "";
  let type = cli.type;
  let purpose = cli.purpose;
  let tone = cli.tone;
  let defaultAgent = cli.agent;
  let additionalTypes = [];

  if (cli.lang) {
    operatingLang = cli.lang;
  }

  // Start with English for the first question
  let t = createI18n("en");

  if (!hasAllRequired) {
    // --- Step 1: Operating language (always in English) ---
    console.log(`\n  ${t("setup.title")}`);
    console.log(`  ${t("setup.separator")}\n`);

    console.log(t("setup.questions.uiLang"));
    const langChoices = t.raw("setup.choices.uiLang");
    operatingLang = await select([
      { key: "en", label: langChoices.en },
      { key: "ja", label: langChoices.ja },
    ], { mode: "single" });

    // Switch to selected language for remaining questions
    t = createI18n(operatingLang);

    // --- Step 2: Project name ---
    if (!projectName) {
      projectName = await ask(t("setup.questions.projectName", { default: defaultName }));
      if (!projectName) projectName = defaultName;
    }

    // --- Step 3: Output language (multi-select) ---
    const outputLangList = t.raw("setup.choices.outputLang");
    const outputLangItems = outputLangList.map((item) => ({
      key: item.key,
      label: item.label,
    }));
    console.log(`\n${t("setup.questions.outputLang")}`);
    outputLangs = await select(outputLangItems, { mode: "multi" });
    if (outputLangs.length === 0) outputLangs = [operatingLang];

    if (outputLangs.length === 1) {
      outputDefault = outputLangs[0];
    } else {
      const defaultChoices = t.raw("setup.choices.outputDefault");
      const defaultItems = outputLangs.map((lang) => ({
        key: lang,
        label: defaultChoices[lang] || lang,
      }));
      console.log(`\n${t("setup.questions.outputDefault")}`);
      outputDefault = await select(defaultItems, { mode: "single" });
    }

    // --- Step 4: Preset selection (tree multi-select) ---
    if (!type) {
      const treeItems = buildTreeItems(PRESETS);
      console.log(`\n${t("setup.questions.fwType")}`);
      const selected = await select(treeItems, {
        mode: "multi",
        autoSelectAncestors: true,
      });
      if (selected.length === 0) {
        type = "base";
      } else {
        type = selected[0];
        additionalTypes = selected.slice(1);
      }
    }

    // --- Step 5: Document style ---
    if (!purpose) {
      const purposeChoices = t.raw("setup.choices.purpose");
      console.log(`\n${t("setup.questions.purpose")}`);
      purpose = await select([
        { key: "developer-guide", label: purposeChoices["developer-guide"] },
        { key: "user-guide", label: purposeChoices["user-guide"] },
        { key: "api-reference", label: purposeChoices["api-reference"] },
        { key: "__other__", label: purposeChoices.other },
      ], { mode: "single" });
      if (purpose === "__other__") {
        purpose = await ask(t("setup.questions.purposeCustom"));
        if (!purpose) purpose = "developer-guide";
      }
    }

    if (!tone) {
      const toneChoices = t.raw("setup.choices.tone");
      console.log(`\n${t("setup.questions.tone")}`);
      tone = await select([
        { key: "polite", label: toneChoices.polite },
        { key: "formal", label: toneChoices.formal },
        { key: "casual", label: toneChoices.casual },
      ], { mode: "single" });
    }

    // --- Step 6: Agent ---
    if (!defaultAgent) {
      const agentChoices = t.raw("setup.choices.agent");
      console.log(`\n${t("setup.questions.agent")}`);
      defaultAgent = await select([
        { key: "claude", label: agentChoices.claude },
        { key: "codex", label: agentChoices.codex },
      ], { mode: "single" });
    }
  } else {
    // Non-interactive mode
    if (!sourcePath) sourcePath = defaultPath;
    if (!projectName) projectName = defaultName;
    if (outputLangs.length === 0) {
      outputLangs = [operatingLang];
      outputDefault = operatingLang;
    }
  }

  // 1. Register project
  const { workRoot } = registerProject(projectName, sourcePath, workRootPath, t);

  // 2. Build config object
  const finalType = additionalTypes.length > 0 ? [type, ...additionalTypes] : type;
  const config = {
    lang: operatingLang,
    type: finalType,
    docs: {
      languages: outputLangs,
      defaultLanguage: outputDefault,
      style: {
        purpose,
        tone,
      },
    },
    flow: {
      merge: "squash",
    },
  };

  if (defaultAgent) {
    config.agent = {
      default: defaultAgent,
      workDir: ".tmp",
      providers: {
        claude: {
          command: "claude",
          args: ["-p", "{{PROMPT}}"],
          systemPromptFlag: "--system-prompt",
          profiles: {
            default: [],
            opus: ["--model", "opus"],
            sonnet: ["--model", "sonnet"],
          },
        },
        codex: {
          command: "codex",
          args: ["exec", "--full-auto", "-C", ".tmp", "{{PROMPT}}"],
          profiles: {
            default: [],
            o3: ["--model", "o3"],
          },
        },
      },
      commands: {
        "docs": { agent: defaultAgent, profile: "default" },
        "docs.review": { agent: defaultAgent, profile: "default" },
        "docs.forge": { agent: defaultAgent, profile: "default" },
        "spec": { agent: defaultAgent, profile: "default" },
        "spec.gate": { agent: defaultAgent, profile: "default" },
        "flow": { agent: defaultAgent, profile: "default" },
      },
    };
  }

  // 3. Validate
  validateConfig(config);

  if (cli.dryRun) {
    console.log("[setup] DRY-RUN: would write the following files:");
    console.log(`  - ${path.join(workRoot, ".sdd-forge", "config.json")}`);
    const agentFileName = defaultAgent === "claude" ? "CLAUDE.md" : "AGENTS.md";
    console.log(`  - ${path.join(workRoot, agentFileName)}`);
    const skillTemplatesDir = path.join(PKG_DIR, "templates", "skills");
    for (const d of fs.readdirSync(skillTemplatesDir, { withFileTypes: true }).filter(d => d.isDirectory())) {
      const srcFile = resolveSkillFile(path.join(skillTemplatesDir, d.name), operatingLang);
      if (!srcFile) continue;
      console.log(`  - ${path.join(workRoot, ".agents", "skills", d.name, "SKILL.md")} (from ${path.basename(srcFile)})`);
      console.log(`  - ${path.join(workRoot, ".claude", "skills", d.name, "SKILL.md")}`);
    }
    console.log("\n[setup] DRY-RUN: config.json content:");
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  // 4. Write config.json
  const sddDir = path.join(workRoot, ".sdd-forge");
  if (!fs.existsSync(sddDir)) {
    fs.mkdirSync(sddDir, { recursive: true });
  }

  const configPath = path.join(sddDir, "config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(t("setup.messages.configGenerated", { path: configPath }));

  // 4b. Ensure agent work directories (-C <dir>)
  for (const provider of Object.values(config.agent?.providers || config.providers || {})) {
    ensureAgentWorkDir(provider, workRoot);
  }

  // 5. Agent config file (CLAUDE.md or AGENTS.md based on agent choice)
  fixClaudeMdSymlink(workRoot);
  const agentConfigFile = defaultAgent === "claude"
    ? path.join(workRoot, "CLAUDE.md")
    : path.join(workRoot, "AGENTS.md");
  ensureAgentConfigFile(agentConfigFile, t);

  // 6. Skills deployment
  setupSkills(workRoot, t, operatingLang);

  // Summary
  console.log(`\n  ${t("setup.messages.summary")}`);
  console.log(`    project:  ${projectName}`);
  console.log(`    source:   ${path.resolve(sourcePath)}`);
  console.log(`    lang:     ${operatingLang}`);
  console.log(`    output:   ${outputLangs.join(", ")} (default: ${outputDefault})`);
  console.log(`    type:     ${Array.isArray(finalType) ? finalType.join(", ") : finalType}`);
  console.log(`    purpose:  ${purpose}`);
  console.log(`    tone:     ${tone}`);
  if (defaultAgent) console.log(`    agent:    ${defaultAgent}`);
  console.log(`\n  ${t("setup.messages.nextSteps")}`);
  console.log(`    ${t("setup.messages.step1")}`);
  console.log("");
}

runIfDirect(import.meta.url, main);

export { main };

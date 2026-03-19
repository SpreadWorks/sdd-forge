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
import { buildTreeItems, treeSelect } from "./lib/tree-select.js";
import { loadSddTemplate } from "./lib/agents-md.js";
import { ensureAgentWorkDir } from "./lib/agent.js";

// ---------------------------------------------------------------------------
// readline helpers
// ---------------------------------------------------------------------------

function ask(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

/**
 * Present a numbered list of choices and return the selected value.
 *
 * @param {readline.Interface} rl
 * @param {string} prompt - Question text
 * @param {{ label: string, value: string }[]} choices
 * @param {function} t - i18n translation function
 * @returns {Promise<string>}
 */
async function askChoice(rl, prompt, choices, t) {
  const lines = choices.map((c, i) => `  [${i + 1}] ${c.label}`);
  console.log(`\n${prompt}`);
  for (const line of lines) console.log(line);
  const choicePrompt = t("common.choicePrompt", { min: 1, max: choices.length });
  const answer = await ask(rl, choicePrompt);
  const idx = Number(answer) - 1;
  if (idx >= 0 && idx < choices.length) return choices[idx].value;
  return choices[0].value;
}

/**
 * Present a numbered list for multi-select (comma-separated).
 * Returns an array of selected values.
 *
 * @param {readline.Interface} rl
 * @param {string} prompt
 * @param {{ label: string, value: string }[]} choices
 * @param {function} t
 * @returns {Promise<string[]>}
 */
async function askMultiChoice(rl, prompt, choices, t) {
  const lines = choices.map((c, i) => `  [${i + 1}] ${c.label}`);
  console.log(`\n${prompt}`);
  for (const line of lines) console.log(line);
  const multiPrompt = t("setup.multiSelectPrompt");
  const answer = await ask(rl, multiPrompt);
  const indices = answer.split(",")
    .map((s) => Number(s.trim()) - 1)
    .filter((i) => i >= 0 && i < choices.length);
  if (indices.length === 0) return [choices[0].value];
  return [...new Set(indices.map((i) => choices[i].value))];
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
  console.log(t("setup.messages.workDir", { path: workRoot }));

  return { workRoot };
}

// ---------------------------------------------------------------------------
// AGENTS.md / CLAUDE.md setup
// ---------------------------------------------------------------------------

/**
 * Interactive AGENTS.md setup.
 *
 * @param {readline.Interface|null} rl - readline interface (null for non-interactive)
 * @param {string} sourceDir - Resolved source directory path
 * @param {string} lang - Output language for template selection
 * @param {function} t - i18n translation function
 * @param {boolean} nonInteractive - Non-interactive mode flag
 */
async function setupAgentsMd(rl, sourceDir, lang, t, nonInteractive) {
  const agentsPath = path.join(sourceDir, "AGENTS.md");
  // Check template exists
  const sddContent = loadSddTemplate(lang);
  if (!sddContent) return;

  const agentsTemplate = [
    '<!-- {{data: agents.sdd("")}} -->',
    '<!-- {{/data}} -->',
    '',
    '<!-- {{data: agents.project("")}} -->',
    '<!-- {{/data}} -->',
    '',
  ].join("\n");

  let mode = "skip";
  if (nonInteractive) {
    mode = fs.existsSync(agentsPath) ? "skip" : "rewrite";
  } else if (rl) {
    const choices = t.raw("setup.choices_agents");
    mode = await askChoice(rl, t("setup.questions.rewriteAgentsMd"), [
      { label: choices.rewrite, value: "rewrite" },
      { label: choices.skip, value: "skip" },
    ], t);
  }

  if (mode === "rewrite") {
    fs.writeFileSync(agentsPath, agentsTemplate, "utf8");
    console.log(t("setup.messages.agentsMdGenerated"));
  } else {
    console.log(t("setup.messages.agentsMdSkipped"));
  }
}

/**
 * Setup CLAUDE.md as an independent file (no symlink).
 * If AGENTS.md exists and CLAUDE.md does not, copy AGENTS.md content to CLAUDE.md.
 * If CLAUDE.md already exists, leave it as-is.
 *
 * @param {string} sourceDir
 * @param {function} t
 * @param {boolean} nonInteractive
 */
function setupClaudeMd(sourceDir, t, nonInteractive) {
  const claudePath = path.join(sourceDir, "CLAUDE.md");
  const agentsPath = path.join(sourceDir, "AGENTS.md");

  // If CLAUDE.md is a symlink, replace with real file
  try {
    const stat = fs.lstatSync(claudePath);
    if (stat.isSymbolicLink()) {
      const content = fs.readFileSync(claudePath, "utf8");
      fs.unlinkSync(claudePath);
      fs.writeFileSync(claudePath, content, "utf8");
      console.log(t("setup.messages.claudeMdCreated"));
      return;
    }
    if (stat.isFile()) {
      // Already a real file — skip
      console.log(t("setup.messages.claudeMdExists"));
      return;
    }
  } catch (_) {
    // path doesn't exist — proceed
  }

  // If AGENTS.md exists, copy its content to CLAUDE.md
  if (fs.existsSync(agentsPath)) {
    const content = fs.readFileSync(agentsPath, "utf8");
    fs.writeFileSync(claudePath, content, "utf8");
    console.log(t("setup.messages.claudeMdCreated"));
  }
}

// ---------------------------------------------------------------------------
// Skills setup
// ---------------------------------------------------------------------------

/**
 * Resolve the skill template filename for the given language.
 * Falls back to SKILL.en.md if the language-specific file does not exist.
 *
 * @param {string} skillDir - Skill template directory
 * @param {string} lang - Language code (e.g. "ja", "en")
 * @returns {string|null} Resolved filename, or null if no template found
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
 * Selects SKILL.{lang}.md based on config lang, falling back to SKILL.en.md.
 *
 * @param {string} workRoot - Work root directory
 * @param {function} t - i18n translation function
 * @param {string} [lang] - Language code for skill selection
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

    // Copy to .agents/skills/<name>/SKILL.md
    const agentsDest = path.join(agentsSkillsDir, name);
    fs.mkdirSync(agentsDest, { recursive: true });
    fs.copyFileSync(srcFile, path.join(agentsDest, "SKILL.md"));

    // Copy to .claude/skills/<name>/SKILL.md
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

  // Parse --lang for non-interactive use: first value is operating lang
  if (cli.lang) {
    operatingLang = cli.lang;
  }

  // Start with English for the first question
  let t = createI18n("en");
  let rl;

  if (!hasAllRequired) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // --- Step 1: Operating language (always in English) ---
    console.log(`\n  ${t("setup.title")}`);
    console.log(`  ${t("setup.separator")}\n`);

    const langChoices = t.raw("setup.choices.uiLang");
    operatingLang = await askChoice(rl, t("setup.questions.uiLang"), [
      { label: langChoices.en, value: "en" },
      { label: langChoices.ja, value: "ja" },
    ], t);

    // Switch to selected language for remaining questions
    t = createI18n(operatingLang);

    // --- Step 2: Project registration ---
    if (!projectName) {
      const answer = await ask(rl, t("setup.questions.projectName", { default: defaultName }));
      projectName = answer || defaultName;
    }

    if (!cli.path) {
      const answer = await ask(rl, t("setup.questions.sourcePath", { default: defaultPath }));
      sourcePath = answer || defaultPath;
    }

    // --- Step 3: Output language (multi-select) ---
    const outputLangList = t.raw("setup.choices.outputLang");
    const outputLangItems = outputLangList.map((item) => ({
      label: item.label,
      value: item.key,
    }));
    outputLangs = await askMultiChoice(rl, t("setup.questions.outputLang"), outputLangItems, t);

    if (outputLangs.length === 1) {
      outputDefault = outputLangs[0];
    } else {
      // Multiple languages selected — ask which is default
      const defaultChoices = t.raw("setup.choices.outputDefault");
      const defaultItems = outputLangs.map((lang) => ({
        label: defaultChoices[lang] || lang,
        value: lang,
      }));
      outputDefault = await askChoice(rl, t("setup.questions.outputDefault"), defaultItems, t);
    }

    // --- Step 4: Preset selection (tree multi-select) ---
    if (!type) {
      const treeItems = buildTreeItems(PRESETS);
      console.log(`\n${t("setup.questions.fwType")}`);
      const selected = await treeSelect(rl, treeItems);
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
      purpose = await askChoice(rl, t("setup.questions.purpose"), [
        { label: purposeChoices["developer-guide"], value: "developer-guide" },
        { label: purposeChoices["user-guide"], value: "user-guide" },
        { label: purposeChoices["api-reference"], value: "api-reference" },
        { label: purposeChoices.other, value: "__other__" },
      ], t);
      if (purpose === "__other__") {
        purpose = await ask(rl, t("setup.questions.purposeCustom"));
        if (!purpose) purpose = "developer-guide";
      }
    }

    if (!tone) {
      const toneChoices = t.raw("setup.choices.tone");
      tone = await askChoice(rl, t("setup.questions.tone"), [
        { label: toneChoices.polite, value: "polite" },
        { label: toneChoices.formal, value: "formal" },
        { label: toneChoices.casual, value: "casual" },
      ], t);
    }

    // --- Step 6: Agent ---
    if (!defaultAgent) {
      const agentChoices = t.raw("setup.choices.agent");
      const agentChoice = await askChoice(rl, t("setup.questions.agent"), [
        { label: agentChoices.claude, value: "claude" },
        { label: agentChoices.codex, value: "codex" },
      ], t);
      defaultAgent = agentChoice;
    }

    // rl.close() is deferred to after AGENTS.md / CLAUDE.md setup
  } else {
    // Non-interactive mode
    if (!sourcePath) sourcePath = defaultPath;
    if (!projectName) projectName = defaultName;
    // Default output config for non-interactive
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
    // Close readline if open
    if (rl) rl.close();

    console.log("[setup] DRY-RUN: would write the following files:");
    console.log(`  - ${path.join(workRoot, ".sdd-forge", "config.json")}`);
    console.log(`  - ${path.join(workRoot, "AGENTS.md")}`);
    console.log(`  - ${path.join(workRoot, "CLAUDE.md")}`);
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

  // 5. AGENTS.md setup
  await setupAgentsMd(rl, workRoot, operatingLang, t, hasAllRequired);

  // 7. CLAUDE.md (independent file)
  setupClaudeMd(workRoot, t, hasAllRequired);

  // 8. Skills deployment
  setupSkills(workRoot, t, operatingLang);

  // Close readline if open
  if (rl) rl.close();

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

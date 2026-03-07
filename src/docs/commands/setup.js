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
import { runIfDirect } from "../../lib/entrypoint.js";
import { PKG_DIR, repoRoot, parseArgs } from "../../lib/cli.js";
import { validateConfig } from "../../lib/types.js";
import { saveContext } from "../../lib/config.js";
import { createI18n } from "../../lib/i18n.js";
import { addProject, workRootFor, loadProjects } from "../../lib/projects.js";
import { presetsForArch } from "../../lib/presets.js";
import { loadSddTemplate } from "../../lib/agents-md.js";
import { ensureAgentWorkDir } from "../../lib/agent.js";

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
    flags: ["--set-default", "--no-default", "--dry-run"],
    options: [
      "--name", "--path", "--work-root",
      "--type", "--purpose", "--tone",
      "--agent", "--project-context",
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
      projectContext: "",
      lang: "",
      setDefault: false,
      noDefault: false,
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
  const gitignorePath = path.join(workRoot, ".sdd-forge", ".gitignore");
  const entry = "projects.json";
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf8");
    if (content.split("\n").some((l) => l.trim() === entry)) return;
    fs.appendFileSync(gitignorePath, `\n${entry}\n`);
  } else {
    fs.writeFileSync(gitignorePath, `${entry}\n`);
  }

  // プロジェクトルートの .gitignore にエントリを追加
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

function registerProject(projectName, sourcePath, workRootPath, setDefault, t) {
  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(t("common.error.pathNotFound", { path: resolved }));
  }

  const resolvedWork = workRootPath ? path.resolve(workRootPath) : resolved;
  const isLocal = resolved === process.cwd() && resolvedWork === resolved;
  const existingData = loadProjects();

  // Local single-project: skip projects.json
  if (isLocal && !existingData) {
    ensureProjectDirs(resolved);
    console.log(t("setup.messages.projectRegistered", { name: projectName }));
    console.log(t("setup.messages.sourceDir", { path: resolved }));
    console.log(t("setup.messages.workDir", { path: resolved }));
    return { alreadyExists: false, workRoot: resolved };
  }

  // Multi-project or remote path: record in projects.json
  // Ensure .sdd-forge directory exists before addProject writes projects.json
  fs.mkdirSync(path.join(process.cwd(), ".sdd-forge"), { recursive: true });
  let data;
  try {
    data = addProject(projectName, resolved, {
      workRoot: workRootPath || undefined,
      setDefault,
    });
  } catch (err) {
    const existing = loadProjects();
    if (existing?.projects?.[projectName]) {
      console.log(t("setup.messages.projectAlreadyExists", { name: projectName }));
      return { alreadyExists: true, workRoot: workRootFor(projectName) };
    }
    throw err;
  }

  const isDefault = data.default === projectName;
  const workRoot = workRootFor(projectName);
  ensureProjectDirs(workRoot);
  ensureGitignore(process.cwd());

  console.log(t("setup.messages.projectRegistered", { name: projectName }));
  console.log(t("setup.messages.sourceDir", { path: resolved }));
  console.log(t("setup.messages.workDir", { path: workRoot }));
  if (isDefault) console.log(t("setup.messages.isDefault"));

  return { alreadyExists: false, workRoot };
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
 * Interactive CLAUDE.md symlink setup.
 *
 * @param {readline.Interface|null} rl
 * @param {string} sourceDir
 * @param {function} t
 * @param {boolean} nonInteractive
 */
async function setupClaudeMdSymlink(rl, sourceDir, t, nonInteractive) {
  const claudePath = path.join(sourceDir, "CLAUDE.md");
  const agentsPath = path.join(sourceDir, "AGENTS.md");

  // If CLAUDE.md exists as a real file (not symlink), offer to rename to AGENTS.md
  try {
    const stat = fs.lstatSync(claudePath);
    if (stat.isFile() && !stat.isSymbolicLink()) {
      // CLAUDE.md is a real file
      if (!fs.existsSync(agentsPath)) {
        // No AGENTS.md yet — rename CLAUDE.md → AGENTS.md, then symlink back
        let rename = nonInteractive;
        if (!nonInteractive && rl) {
          const answer = await askChoice(rl, t("setup.questions.renameClaude"), [
            { label: t.raw("setup.choices_claudemd").yes, value: "yes" },
            { label: t.raw("setup.choices_claudemd").no, value: "no" },
          ], t);
          rename = answer === "yes";
        }
        if (rename) {
          fs.renameSync(claudePath, agentsPath);
          fs.symlinkSync("AGENTS.md", claudePath);
          console.log(t("setup.messages.claudeRenamed"));
          return;
        }
      }
      // AGENTS.md already exists or user declined rename — skip
      console.log(t("setup.messages.claudeMdExists"));
      return;
    }
  } catch (_) {
    // path doesn't exist — proceed to create symlink
  }

  // Skip if AGENTS.md doesn't exist
  if (!fs.existsSync(agentsPath)) return;

  // If AGENTS.md exists and CLAUDE.md doesn't (or is broken symlink) → create symlink
  try { fs.lstatSync(claudePath); fs.unlinkSync(claudePath); } catch (_) {}
  let create = false;
  if (nonInteractive) {
    create = true;
  } else if (rl) {
    const choices = t.raw("setup.choices_claudemd");
    const answer = await askChoice(rl, t("setup.questions.claudeMdSymlink"), [
      { label: choices.yes, value: "yes" },
      { label: choices.no, value: "no" },
    ], t);
    create = answer === "yes";
  }

  if (create) {
    fs.symlinkSync("AGENTS.md", claudePath);
    console.log(t("setup.messages.claudeMdCreated"));
  }
}

// ---------------------------------------------------------------------------
// Skills setup
// ---------------------------------------------------------------------------

/**
 * Deploy skill templates to .agents/skills/ and create symlinks in .claude/skills/.
 *
 * @param {string} workRoot - Work root directory
 * @param {function} t - i18n translation function
 */
function setupSkills(workRoot, t) {
  const agentsSkillsDir = path.join(workRoot, ".agents", "skills");
  const claudeSkillsDir = path.join(workRoot, ".claude", "skills");

  const skillNames = ["sdd-flow-start", "sdd-flow-close"];
  const templatesDir = path.join(PKG_DIR, "templates", "skills");

  for (const name of skillNames) {
    // Copy template to .agents/skills/<name>/SKILL.md
    const destDir = path.join(agentsSkillsDir, name);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(
      path.join(templatesDir, name, "SKILL.md"),
      path.join(destDir, "SKILL.md"),
    );

    // Create relative symlink in .claude/skills/<name>/SKILL.md
    const linkDir = path.join(claudeSkillsDir, name);
    fs.mkdirSync(linkDir, { recursive: true });
    const link = path.join(linkDir, "SKILL.md");
    const target = path.join("..", "..", "..", ".agents", "skills", name, "SKILL.md");
    try { fs.unlinkSync(link); } catch (_) {}
    fs.symlinkSync(target, link);
  }

  console.log(t("setup.messages.skillsDeployed"));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const cli = parseSetupArgs(process.argv.slice(2));

  if (cli.help) {
    console.log([
      "Usage: sdd-forge setup [options]",
      "",
      "Interactive project setup wizard.",
      "",
      "Options:",
      "  --name <name>               Project name",
      "  --path <path>               Source code path (default: cwd)",
      "  --work-root <path>          Output directory path",
      "  --type <type>               Project type: webapp|webapp/cakephp2|cli|library",
      "  --purpose <purpose>         Document purpose: developer-guide|user-guide|api-reference",
      "  --tone <tone>               Writing style: polite|formal|casual",
      "  --agent <agent>             Default agent: claude|codex",
      "  --project-context <text>    Project description text",
      "  --lang <lang>               Operating language: en|ja (also used for output if single lang)",
      "  --set-default               Set as default project",
      "  --no-default                Do not set as default project",
      "  --dry-run                   Show what would be done without writing files",
      "  -h, --help                  Show this help",
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
  let setAsDefault = cli.noDefault ? false : true;
  let operatingLang = cli.lang || "en";
  let outputLangs = [];
  let outputDefault = "";
  let type = cli.type;
  let purpose = cli.purpose;
  let tone = cli.tone;
  let projectContext = cli.projectContext;
  let defaultAgent = cli.agent;

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

    // --- Step 2b: Output path ---
    {
      const answer = await ask(rl, t("setup.questions.workRoot", { default: sourcePath }));
      workRootPath = answer || "";
    }

    // --- Step 2c: Default project ---
    const existingProjects = loadProjects();
    if (existingProjects && Object.keys(existingProjects.projects || {}).length > 0) {
      const choices = t.raw("setup.choices_setDefault");
      const answer = await askChoice(rl, t("setup.questions.setDefault"), [
        { label: choices.yes, value: "yes" },
        { label: choices.no, value: "no" },
      ], t);
      setAsDefault = answer === "yes";
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

    // --- Step 4: Hierarchical type selection ---
    if (!type) {
      const archLabels = t.raw("setup.choices.archType");
      const arch = await askChoice(rl, t("setup.questions.archType"), [
        { label: `webapp — ${archLabels.webapp}`, value: "webapp" },
        { label: `cli — ${archLabels.cli}`, value: "cli" },
        { label: `library — ${archLabels.library}`, value: "library" },
      ], t);

      const presets = presetsForArch(arch);
      if (presets.length > 0) {
        const genericLabel = t.raw("setup.choices.fwGeneric");
        const fwChoices = [
          { label: `generic — ${genericLabel}`, value: arch },
          ...presets.map((p) => ({
            label: `${p.key} — ${p.label}`,
            value: p.type,
          })),
        ];
        type = await askChoice(rl, t("setup.questions.fwType"), fwChoices, t);
      } else {
        type = arch;
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

    // --- Step 6: Project context ---
    if (!projectContext) {
      console.log(`\n${t("setup.questions.projectContext")}`);
      projectContext = await ask(rl, t("setup.prompt"));
    }

    // --- Step 7: Agent ---
    if (!defaultAgent) {
      const agentChoices = t.raw("setup.choices.agent");
      const agentChoice = await askChoice(rl, t("setup.questions.agent"), [
        { label: agentChoices.claude, value: "claude" },
        { label: agentChoices.codex, value: "codex" },
        { label: agentChoices.skip, value: "" },
      ], t);
      defaultAgent = agentChoice;
    }

    // rl.close() is deferred to after AGENTS.md / CLAUDE.md setup
  } else {
    // Non-interactive mode
    if (!sourcePath) sourcePath = defaultPath;
    if (!projectName) projectName = defaultName;
    if (cli.setDefault) setAsDefault = true;
    // Default output config for non-interactive
    if (outputLangs.length === 0) {
      outputLangs = [operatingLang];
      outputDefault = operatingLang;
    }
  }

  // 1. Register project
  const { workRoot } = registerProject(projectName, sourcePath, workRootPath, setAsDefault, t);

  // 2. Build config object
  const config = {
    lang: operatingLang,
    output: {
      languages: outputLangs,
      default: outputDefault,
    },
    type,
    documentStyle: {
      purpose,
      tone,
    },
    textFill: {
      projectContext: "",
      preamblePatterns: [
        { pattern: "^(Here is|以下に|Based on)", flags: "i" },
      ],
    },
    flow: {
      merge: "squash",
    },
  };

  if (defaultAgent) {
    config.defaultAgent = defaultAgent;
    if (defaultAgent === "claude") {
      config.providers = {
        claude: {
          name: "claude-cli",
          command: "claude",
          args: ["--model", "sonnet", "-p", "{{PROMPT}}"],
          systemPromptFlag: "--system-prompt",
        },
      };
    } else if (defaultAgent === "codex") {
      config.providers = {
        codex: {
          name: "codex-cli",
          command: "codex",
          args: ["exec", "--full-auto", "-C", ".tmp", "{{PROMPT}}"],
        },
      };
    }
  }

  // 3. Validate
  validateConfig(config);

  if (cli.dryRun) {
    // Close readline if open
    if (rl) rl.close();

    console.log("[setup] DRY-RUN: would write the following files:");
    console.log(`  - ${path.join(workRoot, ".sdd-forge", "config.json")}`);
    if (projectContext) console.log(`  - ${path.join(workRoot, ".sdd-forge", "context.json")}`);
    console.log(`  - ${path.join(workRoot, "AGENTS.md")}`);
    console.log(`  - ${path.join(workRoot, "CLAUDE.md")} (symlink)`);
    console.log(`  - ${path.join(workRoot, ".agents", "skills", "sdd-flow-start", "SKILL.md")}`);
    console.log(`  - ${path.join(workRoot, ".agents", "skills", "sdd-flow-close", "SKILL.md")}`);
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
  for (const provider of Object.values(config.providers || {})) {
    ensureAgentWorkDir(provider, workRoot);
  }

  // 5. Write context.json if projectContext provided
  if (projectContext) {
    saveContext(workRoot, { projectContext });
    console.log(t("setup.messages.contextGenerated"));
  }

  // 6. AGENTS.md setup
  await setupAgentsMd(rl, workRoot, operatingLang, t, hasAllRequired);

  // 7. CLAUDE.md symlink
  await setupClaudeMdSymlink(rl, workRoot, t, hasAllRequired);

  // 8. Skills deployment
  setupSkills(workRoot, t);

  // Close readline if open
  if (rl) rl.close();

  // Summary
  console.log(`\n  ${t("setup.messages.summary")}`);
  console.log(`    project:  ${projectName}`);
  console.log(`    source:   ${path.resolve(sourcePath)}`);
  console.log(`    lang:     ${operatingLang}`);
  console.log(`    output:   ${outputLangs.join(", ")} (default: ${outputDefault})`);
  console.log(`    type:     ${type}`);
  console.log(`    purpose:  ${purpose}`);
  console.log(`    tone:     ${tone}`);
  if (defaultAgent) console.log(`    agent:    ${defaultAgent}`);
  if (projectContext) console.log(`    context:  ${projectContext.slice(0, 80)}${projectContext.length > 80 ? "..." : ""}`);

  console.log(`\n  ${t("setup.messages.nextSteps")}`);
  console.log(`    ${t("setup.messages.step1")}`);
  console.log("");
}

runIfDirect(import.meta.url, main);

export { main };

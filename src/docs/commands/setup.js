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
import { fileURLToPath } from "url";
import { repoRoot, parseArgs } from "../lib/cli.js";
import { validateConfig } from "../lib/types.js";
import { saveContext } from "../lib/config.js";
import { createI18n } from "../lib/i18n.js";
import { addProject, workRootFor, loadProjects } from "../projects/projects.js";

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
    flags: [],
    options: [
      "--name", "--path",
      "--type", "--purpose", "--tone",
      "--agent", "--project-context",
    ],
    defaults: {
      name: "",
      path: "",
      type: "",
      purpose: "",
      tone: "",
      agent: "",
      projectContext: "",
    },
  });
}

// ---------------------------------------------------------------------------
// Architecture → framework mapping
// ---------------------------------------------------------------------------

const ARCH_FRAMEWORKS = {
  webapp: [
    { key: "generic", value: "webapp" },
    { key: "cakephp2", value: "webapp/cakephp2" },
  ],
  cli: [
    { key: "generic", value: "cli" },
    { key: "node-cli", value: "cli/node-cli" },
  ],
  library: [],
};

// ---------------------------------------------------------------------------
// Project registration
// ---------------------------------------------------------------------------

function registerProject(projectName, sourcePath, t) {
  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(t("common.error.pathNotFound", { path: resolved }));
  }

  let data;
  try {
    data = addProject(projectName, resolved);
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
  const sddDir = path.join(workRoot, ".sdd-forge");
  const outputDir = path.join(sddDir, "output");
  const docsDir = path.join(workRoot, "docs");
  const specsDir = path.join(workRoot, "specs");

  [sddDir, outputDir, docsDir, specsDir].forEach((d) =>
    fs.mkdirSync(d, { recursive: true }),
  );
  fs.writeFileSync(path.join(outputDir, ".gitkeep"), "");

  console.log(t("setup.messages.projectRegistered", { name: projectName }));
  console.log(t("setup.messages.sourceDir", { path: resolved }));
  console.log(t("setup.messages.workDir", { path: workRoot }));
  if (isDefault) console.log(t("setup.messages.isDefault"));

  return { alreadyExists: false, workRoot };
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
      "  --type <type>               Project type: webapp|webapp/cakephp2|cli|library",
      "  --purpose <purpose>         Document purpose: developer-guide|user-guide|api-reference",
      "  --tone <tone>               Writing style: polite|formal|casual",
      "  --agent <agent>             Default agent: claude|codex",
      "  --project-context <text>    Project description text",
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
  let uiLang = "en";
  let outputLangs = [];
  let outputDefault = "";
  let type = cli.type;
  let purpose = cli.purpose;
  let tone = cli.tone;
  let projectContext = cli.projectContext;
  let defaultAgent = cli.agent;

  // Start with English for the first question
  let t = createI18n("en");
  let rl;

  if (!hasAllRequired) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // --- Step 1: UI language (always in English) ---
    console.log(`\n  ${t("setup.title")}`);
    console.log(`  ${t("setup.separator")}\n`);

    const uiLangChoices = t.raw("setup.choices.uiLang");
    uiLang = await askChoice(rl, t("setup.questions.uiLang"), [
      { label: uiLangChoices.en, value: "en" },
      { label: uiLangChoices.ja, value: "ja" },
    ], t);

    // Switch to selected language for remaining questions
    t = createI18n(uiLang);

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

    // --- Step 4: Hierarchical type selection ---
    if (!type) {
      const archLabels = t.raw("setup.choices.archType");
      const arch = await askChoice(rl, t("setup.questions.archType"), [
        { label: `webapp — ${archLabels.webapp}`, value: "webapp" },
        { label: `cli — ${archLabels.cli}`, value: "cli" },
        { label: `library — ${archLabels.library}`, value: "library" },
      ], t);

      const frameworks = ARCH_FRAMEWORKS[arch];
      if (frameworks && frameworks.length > 0) {
        // Build framework choices from i18n
        const fwChoiceKey = arch === "webapp" ? "fwWebapp" : arch === "cli" ? "fwCli" : null;
        if (fwChoiceKey) {
          const fwLabels = t.raw(`setup.choices.${fwChoiceKey}`);
          const fwChoices = frameworks.map((fw) => ({
            label: `${fw.key} — ${fwLabels[fw.key] || fw.key}`,
            value: fw.value,
          }));
          type = await askChoice(rl, t("setup.questions.fwType"), fwChoices, t);
        } else {
          type = arch;
        }
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

    rl.close();
  } else {
    // Non-interactive mode
    if (!sourcePath) sourcePath = defaultPath;
    if (!projectName) projectName = defaultName;
    // Default output config for non-interactive
    outputLangs = ["ja"];
    outputDefault = "ja";
  }

  // 1. Register project
  const { workRoot } = registerProject(projectName, sourcePath, t);

  // 2. Build config object
  const config = {
    uiLang,
    output: {
      languages: outputLangs,
      default: outputDefault,
    },
    lang: outputDefault,
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
  };

  if (defaultAgent) {
    config.defaultAgent = defaultAgent;
    if (defaultAgent === "claude") {
      config.providers = {
        claude: {
          name: "claude-cli",
          command: "claude",
          args: ["--model", "sonnet", "-p", "{{PROMPT}}"],
        },
      };
    } else if (defaultAgent === "codex") {
      config.providers = {
        codex: {
          name: "codex-cli",
          command: "codex",
          args: ["-p", "{{PROMPT}}"],
        },
      };
    }
  }

  // 3. Validate
  validateConfig(config);

  // 4. Write config.json
  const sddDir = path.join(workRoot, ".sdd-forge");
  if (!fs.existsSync(sddDir)) {
    fs.mkdirSync(sddDir, { recursive: true });
  }

  const configPath = path.join(sddDir, "config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(t("setup.messages.configGenerated", { path: configPath }));

  // 5. Write context.json if projectContext provided
  if (projectContext) {
    saveContext(workRoot, { projectContext });
    console.log(t("setup.messages.contextGenerated"));
  }

  // Summary
  console.log(`\n  ${t("setup.messages.summary")}`);
  console.log(`    project:  ${projectName}`);
  console.log(`    source:   ${path.resolve(sourcePath)}`);
  console.log(`    uiLang:   ${uiLang}`);
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

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
  });
}

export { main };

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
import { DEFAULT_LANG, sddDir as sddDirFn } from "./lib/config.js";
import { createI18n } from "./lib/i18n.js";
import { PRESETS, resolveMultiChains } from "./lib/presets.js";
import { buildTreeItems, select } from "./lib/multi-select.js";
import { loadSddTemplate } from "./lib/agents-md.js";
import { ensureAgentWorkDir } from "./lib/agent.js";

// ---------------------------------------------------------------------------
// readline helpers
// ---------------------------------------------------------------------------

function ask(prompt, prefill) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    if (prefill) rl.write(prefill);
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
// Config file I/O
// ---------------------------------------------------------------------------

function readConfigFile(configPath) {
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Load existing config as defaults
// ---------------------------------------------------------------------------

function loadExistingDefaults(workRoot) {
  const configPath = path.join(sddDirFn(workRoot), "config.json");
  const cfg = readConfigFile(configPath);
  if (!cfg) return null;
  const types = Array.isArray(cfg.type) ? cfg.type : cfg.type ? [cfg.type] : [];
  return {
    projectName: cfg.name || "",
    lang: cfg.lang || DEFAULT_LANG,
    type: types[0] || "",
    additionalTypes: types.slice(1),
    outputLangs: cfg.docs?.languages || [],
    outputDefault: cfg.docs?.defaultLanguage || "",
    purpose: cfg.docs?.style?.purpose || "",
    tone: cfg.docs?.style?.tone || "",
    agent: cfg.agent?.default || "",
  };
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

  return { workRoot };
}

// ---------------------------------------------------------------------------
// Agent config file (CLAUDE.md / AGENTS.md) setup
// ---------------------------------------------------------------------------

function buildAgentContent(lang) {
  const sddContent = loadSddTemplate(lang);
  const lines = [];
  lines.push('<!-- {{data("agents.sdd")}} -->');
  if (sddContent) lines.push(sddContent.trimEnd());
  lines.push('<!-- {{/data}} -->');
  lines.push('');
  lines.push('<!-- {{data("agents.project")}} -->');
  lines.push('<!-- {{/data}} -->');
  return lines.join("\n");
}

const SDD_DIRECTIVE_RE = /<!-- \{\{data\("agents\.sdd"\)\}\} -->[\s\S]*?<!-- \{\{\/data\}\} -->/;

function ensureAgentConfigFile(filePath, lang, t) {
  const fileName = path.basename(filePath);
  const agentContent = buildAgentContent(lang);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, agentContent + "\n", "utf8");
    console.log(t("setup.messages.agentFileCreated", { file: fileName }));
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  if (SDD_DIRECTIVE_RE.test(content)) {
    const sddBlock = agentContent.match(SDD_DIRECTIVE_RE)?.[0];
    if (sddBlock) {
      const updated = content.replace(SDD_DIRECTIVE_RE, sddBlock);
      if (updated !== content) {
        fs.writeFileSync(filePath, updated, "utf8");
        console.log(t("setup.messages.agentFileUpdated", { file: fileName }));
      } else {
        console.log(t("setup.messages.agentFileUpToDate", { file: fileName }));
      }
    }
    return;
  }

  const separator = content.endsWith("\n") ? "\n" : "\n\n";
  fs.writeFileSync(filePath, content + separator + agentContent + "\n", "utf8");
  console.log(t("setup.messages.agentFileUpdated", { file: fileName }));
}

function fixClaudeMdSymlink(sourceDir) {
  const claudePath = path.join(sourceDir, "CLAUDE.md");
  try {
    const stat = fs.lstatSync(claudePath);
    if (stat.isSymbolicLink()) {
      const content = fs.readFileSync(claudePath, "utf8");
      fs.unlinkSync(claudePath);
      fs.writeFileSync(claudePath, content, "utf8");
    }
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// Skills setup
// ---------------------------------------------------------------------------

function resolveSkillFile(skillDir, lang) {
  const langFile = path.join(skillDir, `SKILL.${lang}.md`);
  if (fs.existsSync(langFile)) return langFile;
  const enFile = path.join(skillDir, "SKILL.en.md");
  if (fs.existsSync(enFile)) return enFile;
  return null;
}

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
// Interactive wizard (returns settings object)
// ---------------------------------------------------------------------------

async function runWizard(defaults, t) {
  const s = { ...defaults };

  // --- Project name ---
  s.projectName = await ask(
    t("setup.questions.projectName", { default: s.projectName }),
    s.projectName,
  );
  if (!s.projectName) s.projectName = defaults.projectName;

  // --- Output language ---
  const outputLangList = t.raw("setup.choices.outputLang");
  const outputLangItems = outputLangList.map((item) => ({
    key: item.key,
    label: item.label,
  }));
  console.log(`\n${t("setup.questions.outputLang")}`);
  s.outputLangs = await select(outputLangItems, {
    mode: "multi",
    default: s.outputLangs,
  });
  if (s.outputLangs.length === 0) s.outputLangs = [s.lang];

  if (s.outputLangs.length === 1) {
    s.outputDefault = s.outputLangs[0];
  } else {
    const defaultChoices = t.raw("setup.choices.outputDefault");
    const defaultItems = s.outputLangs.map((lang) => ({
      key: lang,
      label: defaultChoices[lang] || lang,
    }));
    console.log(`\n${t("setup.questions.outputDefault")}`);
    s.outputDefault = await select(defaultItems, {
      mode: "single",
      default: s.outputDefault,
    });
  }

  // --- Preset selection ---
  const treeItems = buildTreeItems(PRESETS);
  const presetDefaults = s.additionalTypes.length > 0
    ? [s.type, ...s.additionalTypes]
    : s.type ? [s.type] : [];
  console.log(`\n${t("setup.questions.fwType")}`);
  const selectedPresets = await select(treeItems, {
    mode: "multi",
    autoSelectAncestors: true,
    default: presetDefaults,
  });
  if (selectedPresets.length === 0) {
    s.type = "base";
    s.additionalTypes = [];
  } else {
    s.type = selectedPresets[0];
    s.additionalTypes = selectedPresets.slice(1);
  }

  // --- Document purpose ---
  const purposeChoices = t.raw("setup.choices.purpose");
  console.log(`\n${t("setup.questions.purpose")}`);
  s.purpose = await select([
    { key: "developer-guide", label: purposeChoices["developer-guide"] },
    { key: "user-guide", label: purposeChoices["user-guide"] },
    { key: "api-reference", label: purposeChoices["api-reference"] },
    { key: "__other__", label: purposeChoices.other },
  ], { mode: "single", default: s.purpose });
  if (s.purpose === "__other__") {
    const BUILTIN_PURPOSES = ["developer-guide", "user-guide", "api-reference", "__other__"];
    const prefill = BUILTIN_PURPOSES.includes(defaults.purpose) ? "" : defaults.purpose;
    s.purpose = await ask(t("setup.questions.purposeCustom"), prefill);
    if (!s.purpose) s.purpose = "developer-guide";
  }

  // --- Tone ---
  const toneChoices = t.raw("setup.choices.tone");
  console.log(`\n${t("setup.questions.tone")}`);
  s.tone = await select([
    { key: "polite", label: toneChoices.polite },
    { key: "formal", label: toneChoices.formal },
    { key: "casual", label: toneChoices.casual },
  ], { mode: "single", default: s.tone });

  // --- Agent ---
  const agentChoices = t.raw("setup.choices.agent");
  console.log(`\n${t("setup.questions.agent")}`);
  s.agent = await select([
    { key: "claude", label: agentChoices.claude },
    { key: "codex", label: agentChoices.codex },
  ], { mode: "single", default: s.agent });

  // --- Agent config file ---
  const agentFileName = s.agent === "claude" ? "CLAUDE.md" : "AGENTS.md";
  const agentsChoices = t.raw("setup.choices_agents");
  console.log(`\n${agentFileName}:`);
  s.agentFileMode = await select([
    { key: "generate", label: agentsChoices.rewrite },
    { key: "skip", label: agentsChoices.skip },
  ], { mode: "single", default: s.agentFileMode });

  return s;
}

// ---------------------------------------------------------------------------
// Summary display
// ---------------------------------------------------------------------------

function buildSummaryLines(s, t) {
  const allTypes = s.additionalTypes.length > 0
    ? [s.type, ...s.additionalTypes] : [s.type];
  const chains = resolveMultiChains(allTypes);
  const leafTypes = chains.map((c) => c[c.length - 1].key);
  const agentFile = s.agent === "claude" ? "CLAUDE.md" : "AGENTS.md";

  return [
    `  ${t("setup.messages.summary")}`,
    `    project:    ${s.projectName}`,
    `    lang:       ${s.lang}`,
    `    output:     ${s.outputLangs.join(", ")} (default: ${s.outputDefault})`,
    `    type:       ${leafTypes.join(", ")}`,
    `    purpose:    ${s.purpose}`,
    `    tone:       ${s.tone}`,
    `    agent:      ${s.agent}`,
    `    ${agentFile}: ${s.agentFileMode === "generate" ? "✓" : "skip"}`,
  ];
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
  const sourcePath = cli.path || defaultPath;
  const workRootPath = cli.workRoot || "";

  // Non-interactive mode: all required values provided via CLI
  const hasAllRequired = cli.name && cli.type && cli.purpose && cli.tone;

  let settings;

  if (hasAllRequired) {
    const operatingLang = cli.lang || DEFAULT_LANG;
    const types = cli.type.includes(",") ? cli.type.split(",") : [cli.type];
    settings = {
      projectName: cli.name || defaultName,
      lang: operatingLang,
      outputLangs: [operatingLang],
      outputDefault: operatingLang,
      type: types[0],
      additionalTypes: types.slice(1),
      purpose: cli.purpose,
      tone: cli.tone,
      agent: cli.agent || "",
      agentFileMode: "generate",
    };
  } else {
    // Load existing config as defaults
    const existing = loadExistingDefaults(defaultPath);

    let defaults = {
      projectName: cli.name || defaultName,
      lang: cli.lang || existing?.lang || DEFAULT_LANG,
      outputLangs: existing?.outputLangs || [],
      outputDefault: existing?.outputDefault || "",
      type: cli.type || existing?.type || "",
      additionalTypes: existing?.additionalTypes || [],
      purpose: cli.purpose || existing?.purpose || "",
      tone: cli.tone || existing?.tone || "",
      agent: cli.agent || existing?.agent || "",
      agentFileMode: "generate",
    };

    // --- Language selection (always in English first) ---
    let t = createI18n("en");
    console.log(`\n  ${t("setup.title")}`);
    console.log(`  ${t("setup.separator")}\n`);

    console.log(t("setup.questions.uiLang"));
    const langChoices = t.raw("setup.choices.uiLang");
    defaults.lang = await select([
      { key: "en", label: langChoices.en },
      { key: "ja", label: langChoices.ja },
    ], { mode: "single", default: defaults.lang });

    t = createI18n(defaults.lang);

    // --- Wizard loop with confirmation ---
    while (true) {
      settings = await runWizard(defaults, t);

      // Show summary
      const lines = buildSummaryLines(settings, t);
      console.log("");
      for (const line of lines) console.log(line);

      // Confirm
      const confirmChoices = t.raw("setup.choices.confirm");
      console.log(`\n${confirmChoices?.prompt || "Save this configuration?"}`);
      const confirmed = await select([
        { key: "yes", label: confirmChoices?.yes || "OK" },
        { key: "no", label: confirmChoices?.no || "Edit" },
      ], { mode: "single" });

      if (confirmed === "yes") break;

      // Use current settings as defaults for next round
      defaults = { ...settings };
      console.log("");
    }
  }

  // --- Write phase ---
  const { workRoot } = registerProject(
    settings.projectName, sourcePath, workRootPath,
    createI18n(settings.lang),
  );
  const t = createI18n(settings.lang);

  // Build config: merge wizard values into existing config to preserve customizations
  const configPath = path.join(workRoot, ".sdd-forge", "config.json");
  let config = readConfigFile(configPath) || {};

  // Minimize type array: remove parents that are already implied by children
  const allTypes = settings.additionalTypes.length > 0
    ? [settings.type, ...settings.additionalTypes]
    : [settings.type];
  const chains = resolveMultiChains(allTypes);
  const leafTypes = chains.map((chain) => chain[chain.length - 1].key);
  const finalType = leafTypes.length === 1 ? leafTypes[0] : leafTypes;

  // Wizard-managed fields (overwrite)
  config.name = settings.projectName;
  config.lang = settings.lang;
  config.type = finalType;
  config.docs = {
    ...config.docs,
    languages: settings.outputLangs,
    defaultLanguage: settings.outputDefault,
    style: { ...config.docs?.style, purpose: settings.purpose, tone: settings.tone },
  };
  if (!config.flow) config.flow = { merge: "squash" };

  if (settings.agent) {
    const defaultAgent = {
      default: settings.agent,
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
        "docs": { agent: settings.agent, profile: "default" },
        "docs.review": { agent: settings.agent, profile: "default" },
        "docs.forge": { agent: settings.agent, profile: "default" },
        "spec": { agent: settings.agent, profile: "default" },
        "spec.gate": { agent: settings.agent, profile: "default" },
        "flow": { agent: settings.agent, profile: "default" },
      },
    };

    if (config.agent) {
      // Preserve existing customizations, only update wizard-managed fields
      config.agent.default = settings.agent;
      if (!config.agent.workDir) config.agent.workDir = defaultAgent.workDir;
      // Merge providers: keep custom providers/profiles, add missing defaults
      config.agent.providers = { ...defaultAgent.providers, ...config.agent.providers };
      // Merge commands: keep custom commands, add missing defaults
      config.agent.commands = { ...defaultAgent.commands, ...config.agent.commands };
    } else {
      config.agent = defaultAgent;
    }
  }

  validateConfig(config);

  if (cli.dryRun) {
    console.log("[setup] DRY-RUN: config.json content:");
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  // Write config.json
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(t("setup.messages.configGenerated", { path: configPath }));

  // Ensure agent work directories
  for (const provider of Object.values(config.agent?.providers || {})) {
    ensureAgentWorkDir(provider, workRoot);
  }

  // Agent config file
  if (settings.agentFileMode === "generate") {
    fixClaudeMdSymlink(workRoot);
    const agentConfigFile = settings.agent === "claude"
      ? path.join(workRoot, "CLAUDE.md")
      : path.join(workRoot, "AGENTS.md");
    ensureAgentConfigFile(agentConfigFile, settings.lang, t);
  }

  // Skills
  setupSkills(workRoot, t, settings.lang);

  // Final summary
  console.log(`\n  ${t("setup.messages.nextSteps")}`);
  console.log(`    ${t("setup.messages.step1")}`);
  console.log("");

  process.stdin.unref();
}

runIfDirect(import.meta.url, main);

export { main };

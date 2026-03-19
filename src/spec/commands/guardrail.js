#!/usr/bin/env node
/**
 * src/spec/commands/guardrail.js
 *
 * Manage project guardrail (immutable principles) for spec compliance.
 * Subcommands: init, update
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { translate } from "../../lib/i18n.js";
import { loadConfig, sddDir, sddConfigPath } from "../../lib/config.js";
import { PRESETS_DIR, presetByLeaf, resolveChainSafe } from "../../lib/presets.js";
import { callAgent } from "../../lib/agent.js";

const GUARDRAIL_FILENAME = "guardrail.md";

/**
 * Parse guardrail articles from markdown text.
 * Articles are `###` headings followed by body text until the next `###` or EOF.
 *
 * @param {string} text - Markdown content of guardrail.md
 * @returns {{ title: string, body: string }[]}
 */
export function parseGuardrailArticles(text) {
  const lines = text.split("\n");
  const articles = [];
  let current = null;

  for (const line of lines) {
    const m = line.match(/^###\s+(.+)/);
    if (m) {
      if (current) {
        current.body = current.body.join("\n");
        articles.push(current);
      }
      current = { title: m[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) {
    current.body = current.body.join("\n");
    articles.push(current);
  }
  return articles;
}

/**
 * Build template layers for guardrail using parent chain, read and merge.
 *
 * @param {string} presetKey - Preset name (e.g. "cakephp2", "webapp")
 * @param {string} lang - Locale code
 * @returns {string} Merged guardrail template content
 */
function loadGuardrailTemplate(presetKey, lang) {
  /**
   * Resolve a single template file with lang → en fallback.
   * Returns file content or null.
   */
  function readWithFallback(dir) {
    const primary = path.join(dir, "templates", lang, GUARDRAIL_FILENAME);
    if (fs.existsSync(primary)) return fs.readFileSync(primary, "utf8");
    if (lang !== "en") {
      const fallback = path.join(dir, "templates", "en", GUARDRAIL_FILENAME);
      if (fs.existsSync(fallback)) return fs.readFileSync(fallback, "utf8");
    }
    return null;
  }

  // Resolve parent chain (root → leaf)
  const chain = resolveChainSafe(presetKey);

  // base (first in chain, lowest priority)
  const basePreset = chain.find((p) => p.key === "base");
  const baseContent = basePreset ? readWithFallback(basePreset.dir) : "";
  if (!baseContent) return "";

  // Collect articles from non-base presets in parent chain order
  const extraSections = [];

  function appendArticlesFrom(dir) {
    const content = readWithFallback(dir);
    if (!content) return;
    const articles = parseGuardrailArticles(content);
    for (const a of articles) {
      extraSections.push(`### ${a.title}\n${a.body}`);
    }
  }

  for (const preset of chain) {
    if (preset.key === "base") continue;
    appendArticlesFrom(preset.dir);
  }

  if (extraSections.length > 0) {
    return baseContent.trimEnd() + "\n\n" + extraSections.join("\n\n").trimEnd() + "\n";
  }
  return baseContent;
}

function runInit(root, cli) {
  const t = translate();
  const guardrailPath = path.join(sddDir(root), GUARDRAIL_FILENAME);

  if (fs.existsSync(guardrailPath) && !cli.force) {
    console.error(t("messages:guardrail.alreadyExists", { path: guardrailPath }));
    process.exit(1);
  }

  // Load config to determine type and lang
  let lang = "en";
  let typePath = "base";
  try {
    const config = loadConfig(root);
    lang = config.lang || config.docs?.defaultLanguage || "en";
    if (config.type) typePath = Array.isArray(config.type) ? config.type[0] : config.type;
  } catch (_) {
    // No config — use defaults
  }

  const content = loadGuardrailTemplate(typePath, lang);
  if (!content) {
    console.error(t("messages:guardrail.noTemplate"));
    process.exit(1);
  }

  if (cli.dryRun) {
    console.log(content);
    return;
  }

  const dir = sddDir(root);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(guardrailPath, content, "utf8");
  console.log(t("messages:guardrail.created", { path: guardrailPath }));
}

async function runUpdate(root, cli) {
  const t = translate();
  const guardrailPath = path.join(sddDir(root), GUARDRAIL_FILENAME);

  if (!fs.existsSync(guardrailPath)) {
    console.error(t("messages:guardrail.notFound"));
    process.exit(1);
  }

  // Load analysis.json
  const analysisPath = path.join(sddDir(root), "output", "analysis.json");
  if (!fs.existsSync(analysisPath)) {
    console.error(t("messages:guardrail.analysisNotFound"));
    process.exit(1);
  }

  let config;
  try {
    config = loadConfig(root);
  } catch (_) {
    console.error(t("messages:guardrail.noConfig"));
    process.exit(1);
  }

  const agentName = cli.agent || config.agent?.default;
  if (!agentName) {
    console.error(t("messages:guardrail.noAgent"));
    process.exit(1);
  }

  const existing = fs.readFileSync(guardrailPath, "utf8");
  const analysis = fs.readFileSync(analysisPath, "utf8");

  const prompt = [
    "You are a software architect. Analyze the project structure below and propose additional project-specific guardrail articles.",
    "Each article must be a `### Heading` followed by a description paragraph.",
    "Do NOT repeat articles that already exist.",
    "Output ONLY the new articles in markdown format (### headings + body). No preamble.",
    "",
    "## Existing Guardrail",
    existing,
    "",
    "## Project Analysis",
    analysis,
  ].join("\n");

  console.error(t("messages:guardrail.updating"));
  const result = await callAgent(agentName, prompt, config);

  if (!result || !result.trim()) {
    console.log(t("messages:guardrail.noNewArticles"));
    return;
  }

  if (cli.dryRun) {
    console.log(result);
    return;
  }

  const updated = existing.trimEnd() + "\n\n" + result.trimEnd() + "\n";
  fs.writeFileSync(guardrailPath, updated, "utf8");
  console.log(t("messages:guardrail.updated", { path: guardrailPath }));
}

function main() {
  const root = repoRoot(import.meta.url);
  const subCmd = process.argv[2];
  const argv = process.argv.slice(3);

  if (subCmd === "init") {
    const cli = parseArgs(argv, {
      flags: ["--dry-run", "--force"],
      defaults: { dryRun: false, force: false },
    });
    if (cli.help) {
      const t = translate();
      const h = t.raw("ui:help.cmdHelp.guardrail");
      console.log([h.usage, "", `  ${h.desc}`, "", "Subcommands:", `  ${h.init}`, `  ${h.update}`].join("\n"));
      return;
    }
    runInit(root, cli);
  } else if (subCmd === "update") {
    const cli = parseArgs(argv, {
      flags: ["--dry-run"],
      options: ["--agent"],
      defaults: { dryRun: false, agent: "" },
    });
    if (cli.help) {
      const t = translate();
      const h = t.raw("ui:help.cmdHelp.guardrail");
      console.log([h.usage, "", `  ${h.desc}`, "", "Subcommands:", `  ${h.init}`, `  ${h.update}`].join("\n"));
      return;
    }
    return runUpdate(root, cli);
  } else {
    const t = translate();
    const h = t.raw("ui:help.cmdHelp.guardrail");
    console.log([h.usage, "", `  ${h.desc}`, "", "Subcommands:", `  ${h.init}`, `  ${h.update}`].join("\n"));
  }
}

export { main };

runIfDirect(import.meta.url, main);

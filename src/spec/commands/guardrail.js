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
import { patternToRegex } from "../../docs/lib/scanner.js";

const GUARDRAIL_FILENAME = "guardrail.md";

/** Default meta for articles without a {%meta%} directive. */
const DEFAULT_META = Object.freeze({ phase: ["spec"] });

/** Regex for {%meta%} directive line. */
const META_RE = /^<!--\s*\{%meta:\s*\{(.+?)\}%\}\s*-->$/;

/**
 * Parse a {%meta%} directive value string into a meta object.
 * Supports: phase: [a, b], scope: [*.css], lint: /pattern/flags
 *
 * @param {string} inner - Content inside the outer braces
 * @returns {Object} Parsed meta object
 */
function parseMetaValue(inner) {
  const meta = {};

  // Extract lint pattern first (contains special chars that break simple parsing)
  const lintMatch = inner.match(/lint:\s*(\/(?:[^/\\]|\\.)+\/[gimsuy]*)/);
  if (lintMatch) {
    const raw = lintMatch[1];
    const lastSlash = raw.lastIndexOf("/");
    const pattern = raw.slice(1, lastSlash);
    const flags = raw.slice(lastSlash + 1);
    meta.lint = new RegExp(pattern, flags);
    // Remove lint from inner to simplify remaining parsing
    inner = inner.replace(lintMatch[0], "");
  }

  // Extract array fields: key: [val1, val2]
  const arrayRe = /(\w+):\s*\[([^\]]*)\]/g;
  let m;
  while ((m = arrayRe.exec(inner)) !== null) {
    const key = m[1];
    const values = m[2].split(",").map((s) => s.trim()).filter(Boolean);
    if (values.length > 0) meta[key] = values;
  }

  // Extract scalar fields: key: value (not already parsed)
  const scalarRe = /(\w+):\s*([^,\]\[{}]+)/g;
  while ((m = scalarRe.exec(inner)) !== null) {
    const key = m[1];
    if (key in meta) continue; // Already parsed as array or lint
    const value = m[2].trim();
    if (value) meta[key] = value;
  }

  return meta;
}

/**
 * Parse guardrail articles from markdown text.
 * Articles are `###` headings followed by body text until the next `###` or EOF.
 * Supports optional `<!-- {%meta: {...}%} -->` directive after heading.
 *
 * @param {string} text - Markdown content of guardrail.md
 * @returns {{ title: string, body: string, meta: Object }[]}
 */
export function parseGuardrailArticles(text) {
  const lines = text.split("\n");
  const articles = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^###\s+(.+)/);
    if (heading) {
      if (current) {
        current.body = current.body.join("\n");
        articles.push(current);
      }
      current = { title: heading[1].trim(), body: [], meta: null };
      continue;
    }

    if (current) {
      // Check for {%meta%} directive (only right after heading, before any body)
      if (current.meta === null) {
        const metaMatch = line.match(META_RE);
        if (metaMatch) {
          current.meta = parseMetaValue(metaMatch[1]);
          continue; // Exclude meta line from body
        }
      }
      current.body.push(line);
    }
  }
  if (current) {
    current.body = current.body.join("\n");
    articles.push(current);
  }

  // Apply defaults
  for (const a of articles) {
    if (!a.meta) {
      a.meta = { ...DEFAULT_META };
    } else {
      if (!a.meta.phase) a.meta.phase = [...DEFAULT_META.phase];
    }
  }

  return articles;
}

/**
 * Filter articles by phase.
 *
 * @param {{ title: string, body: string, meta: Object }[]} articles
 * @param {string} phase - "spec" | "impl" | "lint"
 * @returns {{ title: string, body: string, meta: Object }[]}
 */
export function filterByPhase(articles, phase) {
  return articles.filter((a) => {
    const phases = a.meta?.phase || DEFAULT_META.phase;
    return phases.includes(phase);
  });
}

/**
 * Match a file path against scope glob patterns.
 * Uses basename matching: *.css matches any file ending in .css.
 * Supports * as wildcard (same as scanner.js patternToRegex).
 *
 * @param {string} filePath - File path to match
 * @param {string[]|undefined} scope - Glob patterns (undefined = match all)
 * @returns {boolean}
 */
export function matchScope(filePath, scope) {
  if (!scope || scope.length === 0) return true;
  const fileName = path.basename(filePath);
  for (const pattern of scope) {
    const re = patternToRegex(pattern);
    if (re.test(fileName) || re.test(filePath)) return true;
  }
  return false;
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

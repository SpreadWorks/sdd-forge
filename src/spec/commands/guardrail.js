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
import { loadConfig, sddDir } from "../../lib/config.js";
import { resolveChainSafe } from "../../lib/presets.js";
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
 * Resolve guardrail context (lang, presetKey) from config.
 *
 * @param {string} root - project root
 * @returns {{ lang: string, presetKey: string }}
 */
function resolveGuardrailContext(root) {
  let lang = "en";
  let presetKey = "base";
  try {
    const config = loadConfig(root);
    lang = config.lang || config.docs?.defaultLanguage || "en";
    if (config.type) presetKey = Array.isArray(config.type) ? config.type[0] : config.type;
  } catch (_) {
    // No config — use defaults
  }
  return { lang, presetKey };
}

/**
 * Read a guardrail template file with lang → en fallback.
 *
 * @param {string} dir - Preset directory
 * @param {string} lang - Locale code
 * @returns {string|null} File content or null
 */
function readWithFallback(dir, lang) {
  const primary = path.join(dir, "templates", lang, GUARDRAIL_FILENAME);
  if (fs.existsSync(primary)) return fs.readFileSync(primary, "utf8");
  if (lang !== "en") {
    const fallback = path.join(dir, "templates", "en", GUARDRAIL_FILENAME);
    if (fs.existsSync(fallback)) return fs.readFileSync(fallback, "utf8");
  }
  return null;
}

/**
 * Serialize an article back to markdown, preserving metadata.
 *
 * @param {{ title: string, body: string, meta: Object }} article
 * @returns {string}
 */
function serializeArticle(a) {
  const parts = [`### ${a.title}`];
  if (a.meta) {
    const fields = [];
    if (a.meta.phase) fields.push(`phase: [${a.meta.phase.join(", ")}]`);
    if (a.meta.scope) fields.push(`scope: [${a.meta.scope.join(", ")}]`);
    if (a.meta.lint) fields.push(`lint: ${a.meta.lint.toString()}`);
    if (fields.length > 0) {
      parts.push(`<!-- {%meta: {${fields.join(", ")}}%} -->`);
    }
  }
  parts.push(a.body.trim());
  return parts.join("\n");
}

/**
 * Build template text for guardrail using parent chain, read and merge.
 * Used by `guardrail init` to create `.sdd-forge/guardrail.md`.
 *
 * @param {string} presetKey - Preset name (e.g. "cakephp2", "webapp")
 * @param {string} lang - Locale code
 * @returns {string} Merged guardrail template content
 */
function loadGuardrailTemplate(presetKey, lang) {
  const chain = resolveChainSafe(presetKey);
  const basePreset = chain.find((p) => p.key === "base");
  const baseContent = basePreset ? readWithFallback(basePreset.dir, lang) : "";
  if (!baseContent) return "";

  // Collect articles from non-base presets, preserving metadata
  const extraArticles = [];
  for (const preset of chain) {
    if (preset.key === "base") continue;
    const content = readWithFallback(preset.dir, lang);
    if (!content) continue;
    extraArticles.push(...parseGuardrailArticles(content));
  }

  if (extraArticles.length > 0) {
    const serialized = extraArticles.map(serializeArticle).join("\n\n");
    return baseContent.trimEnd() + "\n\n" + serialized.trimEnd() + "\n";
  }
  return baseContent;
}

/**
 * Load all guardrail articles from preset chain as parsed objects.
 *
 * @param {string} presetKey - Preset name
 * @param {string} lang - Locale code
 * @returns {{ title: string, body: string, meta: Object }[]}
 */
function loadPresetArticles(presetKey, lang) {
  const chain = resolveChainSafe(presetKey);
  const articles = [];
  for (const preset of chain) {
    const content = readWithFallback(preset.dir, lang);
    if (!content) continue;
    articles.push(...parseGuardrailArticles(content));
  }
  return articles;
}

/**
 * Load and merge all guardrail articles from preset chain + project guardrail.
 * Used by `guardrail show`, `gate.js`, and `lint.js` for a unified loading pipeline.
 *
 * @param {string} root - project root
 * @returns {{ title: string, body: string, meta: Object }[]} merged articles
 */
export function loadMergedArticles(root) {
  const { lang, presetKey } = resolveGuardrailContext(root);

  // 1. Collect articles from preset chain (object-based, preserves metadata)
  const articles = loadPresetArticles(presetKey, lang);

  // 2. Append articles from project guardrail (.sdd-forge/guardrail.md)
  const projectPath = path.join(sddDir(root), GUARDRAIL_FILENAME);
  if (fs.existsSync(projectPath)) {
    const projectText = fs.readFileSync(projectPath, "utf8");
    const projectArticles = parseGuardrailArticles(projectText);
    const existingTitles = new Set(articles.map((a) => a.title.toLowerCase()));
    for (const a of projectArticles) {
      if (!existingTitles.has(a.title.toLowerCase())) {
        articles.push(a);
      }
    }
  }

  return articles;
}

function runShow(root, cli) {
  if (!cli.phase) {
    console.error("--phase is required for show");
    process.exit(1);
  }

  const articles = loadMergedArticles(root);
  const filtered = filterByPhase(articles, cli.phase);

  if (filtered.length === 0) return;

  const output = filtered.map((a) => {
    const metaLine = a.meta
      ? `<!-- {%meta: {phase: [${a.meta.phase.join(", ")}]}%} -->\n`
      : "";
    return `### ${a.title}\n${metaLine}${a.body.trim()}`;
  }).join("\n\n");

  console.log(output);
}

function runInit(root, cli) {
  const t = translate();
  const guardrailPath = path.join(sddDir(root), GUARDRAIL_FILENAME);

  if (fs.existsSync(guardrailPath) && !cli.force) {
    console.error(t("messages:guardrail.alreadyExists", { path: guardrailPath }));
    process.exit(1);
  }

  const { lang, presetKey } = resolveGuardrailContext(root);
  const content = loadGuardrailTemplate(presetKey, lang);
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

  if (subCmd === "show") {
    const cli = parseArgs(argv, {
      options: ["--phase"],
      defaults: { phase: "" },
    });
    runShow(root, cli);
  } else if (subCmd === "init") {
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

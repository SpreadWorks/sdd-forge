/**
 * src/lib/guardrail.js
 *
 * Shared guardrail logic: parse, filter, match, and load guardrail articles.
 * Extracted from spec/commands/guardrail.js for use by flow commands.
 */

import fs from "fs";
import path from "path";
import { loadConfig, sddDir } from "./config.js";
import { resolveChainSafe } from "./presets.js";
import { patternToRegex } from "../docs/lib/scanner.js";

const GUARDRAIL_FILENAME = "guardrail.md";

/** Default meta for articles without a {%guardrail%} block. */
const DEFAULT_META = Object.freeze({ phase: ["spec"] });

/** Regex for {%guardrail ...%} opening tag. */
const GUARDRAIL_OPEN_RE = /^<!--\s*\{%guardrail\s+\{(.+?)\}%\}\s*-->$/;

/** Regex for {%/guardrail%} closing tag. */
const GUARDRAIL_CLOSE_RE = /^<!--\s*\{%\/guardrail%\}\s*-->$/;

/**
 * Parse a guardrail directive value string into a meta object.
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
    if (key in meta) continue;
    const value = m[2].trim();
    if (value) meta[key] = value;
  }

  return meta;
}

/**
 * Parse guardrail articles from markdown text.
 * Articles are found inside `{%guardrail%}` blocks.
 * Each block wraps `###` headings and their body text.
 *
 * @param {string} text - Markdown content of guardrail.md
 * @returns {{ title: string, body: string, meta: Object }[]}
 */
export function parseGuardrailArticles(text) {
  const lines = text.split("\n");
  const articles = [];
  let currentMeta = null;
  let inGuardrail = false;
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for {%guardrail ...%} opening tag
    const openMatch = trimmed.match(GUARDRAIL_OPEN_RE);
    if (openMatch) {
      currentMeta = parseMetaValue(openMatch[1]);
      inGuardrail = true;
      continue;
    }

    // Check for {%/guardrail%} closing tag
    if (GUARDRAIL_CLOSE_RE.test(trimmed)) {
      if (current) {
        current.body = current.body.join("\n");
        articles.push(current);
        current = null;
      }
      inGuardrail = false;
      currentMeta = null;
      continue;
    }

    if (!inGuardrail) continue;

    // Inside guardrail block: look for ### headings
    const heading = line.match(/^###\s+(.+)/);
    if (heading) {
      if (current) {
        current.body = current.body.join("\n");
        articles.push(current);
      }
      current = { title: heading[1].trim(), body: [], meta: currentMeta ? { ...currentMeta } : null };
      continue;
    }

    if (current) {
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
 * @param {string} phase - "spec" | "impl" | "lint" | "draft"
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
 * Serialize an article back to markdown, preserving metadata.
 *
 * @param {{ title: string, body: string, meta: Object }} article
 * @returns {string}
 */
export function serializeArticle(a) {
  const fields = [];
  if (a.meta?.phase) fields.push(`phase: [${a.meta.phase.join(", ")}]`);
  if (a.meta?.scope) fields.push(`scope: [${a.meta.scope.join(", ")}]`);
  if (a.meta?.lint) fields.push(`lint: ${a.meta.lint.toString()}`);

  const metaStr = fields.length > 0 ? `{${fields.join(", ")}}` : "{phase: [spec]}";
  const parts = [
    `<!-- {%guardrail ${metaStr}%} -->`,
    `### ${a.title}`,
    a.body.trim(),
    `<!-- {%/guardrail%} -->`,
  ];
  return parts.join("\n");
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

/**
 * Build template text for guardrail using parent chain, read and merge.
 * Used by `guardrail init` to create `.sdd-forge/guardrail.md`.
 *
 * @param {string} presetKey - Preset name (e.g. "cakephp2", "webapp")
 * @param {string} lang - Locale code
 * @returns {string} Merged guardrail template content
 */
export function loadGuardrailTemplate(presetKey, lang) {
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

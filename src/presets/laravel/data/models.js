/**
 * ModelsSource — Laravel Eloquent models DataSource.
 *
 * Extends the webapp parent ModelsSource with Laravel-specific
 * parse logic and resolve methods.
 *
 * Available methods (called via {{data}} directives):
 *   models.relations("Model|Associations")
 *   models.scopes("Model|Scope")
 *   models.casts("Model|Attribute|Cast Type")
 */

import fs from "fs";
import path from "path";
import ModelsSource from "../../webapp/data/models.js";
import { ModelEntry } from "../../webapp/data/models.js";
import { camelToSnake, pluralize, findFiles } from "../../../docs/lib/scanner.js";

export class LaravelModelEntry extends ModelEntry {
  fillable = null;
  guarded = null;
  casts = null;
  hidden = null;
  scopes = null;
  accessors = null;
}

// ---------------------------------------------------------------------------
// Shared parse helpers (used by both parse() and analyzeModels())
// ---------------------------------------------------------------------------

function extractArrayProp(content, propName) {
  const regex = new RegExp(
    `protected\\s+\\$${propName}\\s*=\\s*\\[([^\\]]*?)\\]`,
    "s",
  );
  const match = content.match(regex);
  if (!match) return [];
  const items = [];
  const itemRegex = /['"]([^'"]+)['"]/g;
  let m;
  while ((m = itemRegex.exec(match[1])) !== null) {
    items.push(m[1]);
  }
  return items;
}

function extractAssocProp(content, propName) {
  const regex = new RegExp(
    `protected\\s+\\$${propName}\\s*=\\s*\\[([^\\]]*?)\\]`,
    "s",
  );
  const match = content.match(regex);
  if (!match) return {};
  const result = {};
  const pairRegex = /['"]([^'"]+)['"]\s*=>\s*['"]?([^'",\]\s]+)['"]?/g;
  let m;
  while ((m = pairRegex.exec(match[1])) !== null) {
    result[m[1]] = m[2];
  }
  return result;
}

function extractRelations(content) {
  const relations = {};
  const relTypes = [
    "hasOne",
    "hasMany",
    "belongsTo",
    "belongsToMany",
    "morphTo",
    "morphMany",
    "morphOne",
    "morphToMany",
  ];

  for (const relType of relTypes) {
    const regex = new RegExp(
      `public\\s+function\\s+(\\w+)\\s*\\([^)]*\\)\\s*(?::\\s*\\w+)?\\s*\\{[^}]*\\$this->${relType}\\(\\s*([\\w\\\\:]+)`,
      "g",
    );
    let m;
    while ((m = regex.exec(content)) !== null) {
      if (!relations[relType]) relations[relType] = [];
      const target = m[2].replace(/::class$/, "").split("\\").pop();
      relations[relType].push({ method: m[1], model: target });
    }
  }

  return relations;
}

/**
 * Parse Laravel Eloquent model content string and return raw parse result.
 * No file I/O — caller provides content.
 *
 * @param {string} content - PHP source code
 * @returns {{ className: string|null, parentClass: string, tableName: string|null, fillable: string[], guarded: string[], casts: Object, hidden: string[], relations: Object, scopes: string[], accessors: string[] }}
 */
function parseModelContent(content) {
  // Only process Eloquent models
  if (!/extends\s+Model\b/.test(content) && !/use\s+HasFactory\b/.test(content)) {
    return null;
  }

  const classMatch = content.match(/class\s+(\w+)\s+extends\s+(\w+)/);
  const className = classMatch ? classMatch[1] : null;
  const parentClass = classMatch ? classMatch[2] : "";

  const tableMatch = content.match(
    /protected\s+\$table\s*=\s*['"]([^'"]+)['"]/,
  );
  const tableName = tableMatch
    ? tableMatch[1]
    : className
      ? pluralize(camelToSnake(className))
      : null;

  const fillable = extractArrayProp(content, "fillable");
  const guarded = extractArrayProp(content, "guarded");
  const casts = extractAssocProp(content, "casts");
  const hidden = extractArrayProp(content, "hidden");
  const relations = extractRelations(content);

  // Scopes
  const scopes = [];
  const scopeRegex = /public\s+function\s+scope(\w+)\s*\(/g;
  let m;
  while ((m = scopeRegex.exec(content)) !== null) {
    scopes.push(m[1]);
  }

  // Accessors (Laravel 9+ Attribute style + legacy getXxxAttribute)
  const accessors = [];
  const oldAccRegex = /public\s+function\s+get(\w+)Attribute\s*\(/g;
  while ((m = oldAccRegex.exec(content)) !== null) {
    accessors.push(m[1]);
  }
  const newAccRegex =
    /protected\s+function\s+(\w+)\s*\(\)\s*:\s*Attribute\b/g;
  while ((m = newAccRegex.exec(content)) !== null) {
    accessors.push(m[1]);
  }

  return { className, parentClass, tableName, fillable, guarded, casts, hidden, relations, scopes, accessors };
}

export default class LaravelModelsSource extends ModelsSource {
  static Entry = LaravelModelEntry;

  match(relPath) {
    return (
      relPath.startsWith("app/Models/") &&
      relPath.endsWith(".php")
    );
  }

  parse(absPath) {
    const entry = new LaravelModelEntry();
    const content = fs.readFileSync(absPath, "utf8");
    const parsed = parseModelContent(content);
    if (!parsed) return entry;

    entry.className = parsed.className;
    entry.parentClass = parsed.parentClass;
    entry.tableName = parsed.tableName;
    entry.fillable = parsed.fillable;
    entry.guarded = parsed.guarded;
    entry.casts = parsed.casts;
    entry.hidden = parsed.hidden;
    entry.relations = parsed.relations;
    entry.scopes = parsed.scopes;
    entry.accessors = parsed.accessors;

    return entry;
  }

  /** Model relations table. */
  relations(analysis, labels) {
    const models = analysis.models?.entries || [];
    if (models.length === 0) return null;
    const rows = [];
    for (const model of models) {
      if (!model.relations) continue;
      const targets = [];
      for (const [type, list] of Object.entries(model.relations)) {
        if (Array.isArray(list) && list.length > 0) {
          targets.push(`${type}: ${list.map((r) => r.model).join(", ")}`);
        }
      }
      if (targets.length > 0) {
        rows.push([model.className, targets.join(" / ")]);
      }
    }
    if (rows.length === 0) return null;
    rows.sort((a, b) => a[0].localeCompare(b[0]));
    return this.toMarkdownTable(rows, labels);
  }

  /** Model scopes table. */
  scopes(analysis, labels) {
    const models = analysis.models?.entries || [];
    if (models.length === 0) return null;
    const rows = [];
    for (const model of models) {
      for (const scope of model.scopes || []) {
        rows.push([model.className, scope]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Model attribute casts table. */
  casts(analysis, labels) {
    const models = analysis.models?.entries || [];
    if (models.length === 0) return null;
    const rows = [];
    for (const model of models) {
      for (const [attr, type] of Object.entries(model.casts || {})) {
        rows.push([model.className, attr, type]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzer (moved from scan/models.js, used by tests)
// ---------------------------------------------------------------------------

export function analyzeModels(sourceRoot) {
  let baseDir = path.join(sourceRoot, "app", "Models");
  if (!fs.existsSync(baseDir)) {
    baseDir = path.join(sourceRoot, "app");
  }
  if (!fs.existsSync(baseDir)) return { models: [], summary: { total: 0 } };

  const files = findFiles(baseDir, "*.php", [], true);
  const models = [];
  for (const f of files) {
    const content = fs.readFileSync(f.absPath, "utf8");
    const parsed = parseModelContent(content);
    if (!parsed) continue;

    const isInModelsDir = baseDir.endsWith(path.join("app", "Models"));
    const filePrefix = isInModelsDir ? "app/Models" : "app";

    models.push({
      file: path.join(filePrefix, f.relPath),
      className: parsed.className ?? path.basename(f.absPath, ".php"),
      parentClass: parsed.parentClass,
      tableName: parsed.tableName,
      fillable: parsed.fillable,
      guarded: parsed.guarded,
      casts: parsed.casts,
      hidden: parsed.hidden,
      relations: parsed.relations,
      scopes: parsed.scopes,
      accessors: parsed.accessors,
      lines: f.lines, hash: f.hash, mtime: f.mtime,
    });
  }

  return { models, summary: { total: models.length } };
}

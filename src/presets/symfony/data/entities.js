/**
 * EntitiesSource — Symfony Doctrine entities DataSource.
 *
 * Symfony-only category using Scannable(DataSource) directly.
 *
 * Available methods (called via {{data}} directives):
 *   entities.relations("Entity|Associations")
 *   entities.columns("Entity|Column|Type|Nullable|Key")
 */

import fs from "fs";
import path from "path";
import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { camelToSnake } from "../../../docs/lib/php-array-parser.js";
import { findFiles } from "../../../docs/lib/scanner.js";
import { hasPathPrefix } from "../../lib/path-match.js";

export class EntityEntry extends AnalysisEntry {
  className = null;
  tableName = null;
  repositoryClass = null;
  columns = null;
  relations = null;

  static summary = {};
}

// ---------------------------------------------------------------------------
// Shared parse helpers (used by both parse() and analyzeEntities())
// ---------------------------------------------------------------------------

function extractColumns(content) {
  const columns = [];
  const lines = content.split("\n");
  const attrBuffer = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Accumulate #[ORM\...] attribute lines
    if (/^\s*#\[ORM\\/.test(line)) {
      attrBuffer.push(trimmed);
      continue;
    }

    // Property declaration
    const propMatch = trimmed.match(/^(?:private|protected|public)\s+(\??\w+)\s+\$(\w+)/);
    if (propMatch) {
      const attrBlock = attrBuffer.join("\n");
      const phpType = propMatch[1];

      const hasColumn = /#\[ORM\\Column/.test(attrBlock);
      const hasId = /#\[ORM\\Id\b/.test(attrBlock);

      if (hasColumn || hasId) {
        const typeMatch = attrBlock.match(/#\[ORM\\Column\s*\([^)]*type:\s*['"](\w+)['"]/);
        const type = typeMatch ? typeMatch[1] : phpType.replace(/^\?/, "") || "string";

        const lengthMatch = attrBlock.match(/#\[ORM\\Column\s*\([^)]*length:\s*(\d+)/);
        const length = lengthMatch ? parseInt(lengthMatch[1]) : null;

        const nullable = /#\[ORM\\Column\s*\([^)]*nullable:\s*true/.test(attrBlock) || phpType.startsWith("?");

        columns.push({ name: propMatch[2], type, length, nullable, id: hasId });
      }

      attrBuffer.length = 0;
      continue;
    }

    // Non-attribute, non-property line — reset buffer
    if (trimmed && !trimmed.startsWith("#[")) {
      attrBuffer.length = 0;
    }
  }

  return columns;
}

function extractRelations(content) {
  const relations = {};
  const relTypes = ["OneToMany", "ManyToOne", "OneToOne", "ManyToMany"];

  for (const relType of relTypes) {
    const regex = new RegExp(
      `#\\[ORM\\\\${relType}\\s*\\(([^)]*?)\\)\\][\\s\\S]*?(?:private|protected|public)\\s+\\??\\w+\\s+\\$(\\w+)`,
      "g",
    );
    let m;
    while ((m = regex.exec(content)) !== null) {
      const attrContent = m[1];
      const propName = m[2];

      const targetMatch = attrContent.match(/targetEntity:\s*([\w\\]+?)(?:::class)?(?:[,\s)]|$)/);
      const target = targetMatch ? targetMatch[1].split("\\").pop() : "";

      if (!relations[relType]) relations[relType] = [];
      relations[relType].push({ property: propName, target });
    }
  }

  return relations;
}

/**
 * Parse Symfony Doctrine entity content string and return raw parse result.
 * No file I/O — caller provides content.
 *
 * @param {string} content - PHP source code
 * @returns {null | { className: string, tableName: string, repositoryClass: string, columns: Array, relations: Object }}
 */
function parseEntityContent(content) {
  // Only parse files with Doctrine ORM annotations
  if (!/#\[ORM\\Entity/.test(content) && !/#\[ORM\\Table/.test(content)) {
    return null;
  }

  const classMatch = content.match(/class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : null;

  const tableMatch = content.match(/#\[ORM\\Table\s*\(\s*name:\s*['"](\w+)['"]/);
  const tableName = tableMatch ? tableMatch[1] : camelToSnake(className);

  const repoMatch = content.match(/#\[ORM\\Entity\s*\(\s*repositoryClass:\s*([\w\\]+)(?:::class)?/);
  const repositoryClass = repoMatch ? repoMatch[1].split("\\").pop() : "";

  return {
    className,
    tableName,
    repositoryClass,
    columns: extractColumns(content),
    relations: extractRelations(content),
  };
}

export default class EntitiesSource extends WebappDataSource {
  static Entry = EntityEntry;

  match(relPath) {
    return relPath.endsWith(".php") && hasPathPrefix(relPath, "src/Entity/");
  }

  parse(absPath) {
    const entry = new EntityEntry();
    const content = fs.readFileSync(absPath, "utf8");
    const parsed = parseEntityContent(content);
    if (!parsed) return entry;

    entry.className = parsed.className ?? path.basename(absPath, ".php");
    entry.tableName = parsed.tableName;
    entry.repositoryClass = parsed.repositoryClass;
    entry.columns = parsed.columns;
    entry.relations = parsed.relations;

    return entry;
  }

  /** Entity relations table (grouped by relation type). */
  relations(analysis, labels) {
    const entities = analysis.entities?.entries || [];
    if (entities.length === 0) return null;
    const rows = [];
    for (const entity of entities) {
      if (!entity.relations) continue;
      const targets = [];
      for (const [type, list] of Object.entries(entity.relations)) {
        if (Array.isArray(list) && list.length > 0) {
          targets.push(`${type}: ${list.map((r) => r.target).join(", ")}`);
        }
      }
      if (targets.length > 0) {
        rows.push([entity.className, targets.join(" / ")]);
      }
    }
    if (rows.length === 0) return null;
    rows.sort((a, b) => a[0].localeCompare(b[0]));
    return this.toMarkdownTable(rows, labels);
  }

  /** Entity columns table. */
  columns(analysis, labels) {
    const entities = analysis.entities?.entries || [];
    if (entities.length === 0) return null;
    const rows = [];
    for (const entity of entities) {
      for (const col of entity.columns || []) {
        rows.push([
          entity.className,
          col.name,
          col.type,
          col.nullable ? "YES" : "NO",
          col.id ? "PK" : "",
        ]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzer (moved from scan/entities.js, used by tests)
// ---------------------------------------------------------------------------

/**
 * @param {string} sourceRoot
 * @returns {{ entities: Object[], summary: { total: number } }}
 */
export function analyzeEntities(sourceRoot) {
  const baseDir = path.join(sourceRoot, "src", "Entity");
  if (!fs.existsSync(baseDir)) return { entities: [], summary: { total: 0 } };

  const files = findFiles(baseDir, "*.php", [], true);
  const entities = [];
  for (const f of files) {
    const content = fs.readFileSync(f.absPath, "utf8");
    const parsed = parseEntityContent(content);
    if (!parsed) continue;

    entities.push({
      file: path.join("src/Entity", f.relPath),
      className: parsed.className ?? path.basename(f.absPath, ".php"),
      tableName: parsed.tableName,
      repositoryClass: parsed.repositoryClass,
      columns: parsed.columns,
      relations: parsed.relations,
      lines: f.lines, hash: f.hash, mtime: f.mtime,
    });
  }

  return { entities, summary: { total: entities.length } };
}

/**
 * EntitiesSource — Symfony Doctrine entities DataSource.
 *
 * Symfony-only category using Scannable(DataSource) directly.
 *
 * Available methods (called via {{data}} directives):
 *   entities.relations("Entity|Associations")
 *   entities.columns("Entity|Column|Type|Nullable|Key")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { analyzeEntities } from "../scan/entities.js";

export default class EntitiesSource extends Scannable(DataSource) {
  scan(sourceRoot, scanCfg) {
    const result = analyzeEntities(sourceRoot);
    return { symfonyEntities: result.entities };
  }

  /** Entity relations table (grouped by relation type). */
  relations(analysis, labels) {
    const entities = analysis.extras?.symfonyEntities || [];
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
    const entities = analysis.extras?.symfonyEntities || [];
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

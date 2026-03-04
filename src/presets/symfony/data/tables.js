/**
 * TablesSource — Symfony migrations DataSource.
 *
 * Combines scan (source code extraction) and resolve (Markdown rendering)
 * into a single self-contained class.
 *
 * Available methods (called via @data directives):
 *   tables.list("Name|Columns|Description")
 *   tables.columns("Table|Column|Type|Nullable")
 *   tables.fk("Table|Column|References")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { analyzeMigrations } from "../scan/migrations.js";

class TablesSource extends DataSource {
  scan(sourceRoot) {
    return analyzeMigrations(sourceRoot);
  }

  /** Table list table. */
  list(analysis, labels) {
    const tables = analysis.extras?.migrations || [];
    if (tables.length === 0) return null;
    const rows = this.toRows(tables, (t) => [
      t.name,
      t.columns.length,
      this.desc("tables", t.name),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Table columns table. */
  columns(analysis, labels) {
    const tables = analysis.extras?.migrations || [];
    if (tables.length === 0) return null;
    const rows = [];
    for (const t of tables) {
      for (const col of t.columns) {
        rows.push([t.name, col.name, col.type, col.nullable ? "YES" : "NO"]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Foreign keys table. */
  fk(analysis, labels) {
    const tables = analysis.extras?.migrations || [];
    if (tables.length === 0) return null;
    const rows = [];
    for (const t of tables) {
      for (const fk of t.foreignKeys) {
        rows.push([t.name, fk.column, `${fk.on}.${fk.references}`]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }
}

export default new TablesSource();

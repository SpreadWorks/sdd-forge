/**
 * TablesSource — Symfony migrations DataSource.
 *
 * Extends the webapp parent TablesSource with Symfony-specific
 * scan logic and resolve methods.
 *
 * Available methods (called via {{data}} directives):
 *   tables.list("Name|Columns|Description")
 *   tables.columns("Table|Column|Type|Nullable")
 *   tables.fk("Table|Column|References")
 */

import TablesSource from "../../webapp/data/tables.js";
import { analyzeMigrations } from "../scan/migrations.js";

export default class SymfonyTablesSource extends TablesSource {
  match(file) {
    return /\.php$/.test(file.fileName) && file.relPath.startsWith("migrations/");
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = this.deriveSourceRoot(files);
    const result = analyzeMigrations(sourceRoot);
    return { migrations: result.tables, migrationsSummary: result.summary };
  }

  /** Table list table. */
  list(analysis, labels) {
    const tables = analysis.tables?.migrations || [];
    if (tables.length === 0) return null;
    const rows = this.toRows(tables, (t) => [
      t.name,
      t.columns.length,
      this.desc("tables", t.name, t.summary),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Table columns table. */
  columns(analysis, labels) {
    const tables = analysis.tables?.migrations || [];
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
    const tables = analysis.tables?.migrations || [];
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

/**
 * DbSchemaSource — enrich-based DataSource for database schema.
 *
 * Reads analysis.schema to generate table/relationship tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class DbSchemaSource extends DataSource {
  /** Database tables list. */
  tables(analysis, labels) {
    const items = analysis.schema?.tables;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (t) => [
      t.name || "—",
      Array.isArray(t.columns) ? t.columns.join(", ") : (t.columns || "—"),
      t.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Table", "Columns", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Table relationships list. */
  relationships(analysis, labels) {
    const items = analysis.schema?.relations;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.from || "—",
      r.to || "—",
      r.type || "—",
      r.foreignKey || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["From", "To", "Type", "Foreign Key"];
    return this.toMarkdownTable(rows, hdr);
  }
}

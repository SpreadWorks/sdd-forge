/**
 * DrizzleSchemaSource — enrich-based DataSource for Drizzle ORM schema.
 *
 * Reads analysis.schemas to generate schema tables.
 * Inherits from database preset's schema for table/relation methods.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class DrizzleSchemaSource extends DataSource {
  /** Drizzle schema tables list (inherits analysis.schemas.tables). */
  tables(analysis, labels) {
    const items = analysis.schemas?.tables;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (t) => [
      t.name || "—",
      Array.isArray(t.columns) ? t.columns.join(", ") : (t.columns || "—"),
      t.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Table", "Columns", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Drizzle relations list. */
  relations(analysis, labels) {
    const items = analysis.schemas?.relations;
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

  /** Schema definition files list. */
  files(analysis, labels) {
    const items = analysis.schemas?.files;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (f) => [
      f.file || f.relPath || "—",
      f.tables || "—",
      f.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["File", "Tables", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

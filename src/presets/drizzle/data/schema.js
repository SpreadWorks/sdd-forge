/**
 * DrizzleSchemaSource — Scannable DataSource for Drizzle ORM schema.
 *
 * Scans Drizzle schema TypeScript files and drizzle.config.* to extract
 * table definitions, columns, and relations via regex.
 *
 * Available methods:
 *   schema.tables("Table|Columns|Description")
 *   schema.relations("From|To|Type|Foreign Key")
 *   schema.files("File|Tables|Description")
 */

import fs from "fs";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";

/** Match: export const users = pgTable("users", { ... }) */
const TABLE_RE = /export\s+const\s+(\w+)\s*=\s*(?:pg|sqlite|mysql)Table\s*\(\s*["'](\w+)["']/g;

/** Match column definitions: id: serial("id").primaryKey() */
const COLUMN_RE = /(\w+)\s*:\s*(\w+)\s*\(/g;

/** Match relations: export const usersRelations = relations(users, ...) */
const RELATION_RE = /export\s+const\s+(\w+)\s*=\s*relations\s*\(\s*(\w+)/g;

export default class DrizzleSchemaSource extends Scannable(DataSource) {
  match(file) {
    return /(?:schema\.ts|schema\/.*\.ts|drizzle\.config\.\w+)$/.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;

    const tables = [];
    const relations = [];
    const fileEntries = [];

    for (const f of files) {
      const content = fs.readFileSync(f.absPath, "utf8");
      const fileTables = [];

      // Extract table definitions
      for (const m of content.matchAll(TABLE_RE)) {
        const varName = m[1];
        const tableName = m[2];
        fileTables.push(tableName);

        // Extract columns from the table block
        // Find the opening brace after the table name and extract columns
        const tableStart = m.index + m[0].length;
        const blockStart = content.indexOf("{", tableStart);
        if (blockStart === -1) continue;

        let depth = 1;
        let pos = blockStart + 1;
        while (pos < content.length && depth > 0) {
          if (content[pos] === "{") depth++;
          else if (content[pos] === "}") depth--;
          pos++;
        }
        const block = content.slice(blockStart + 1, pos - 1);

        const columns = [];
        for (const cm of block.matchAll(COLUMN_RE)) {
          columns.push(cm[1]);
        }

        tables.push({ name: tableName, varName, columns });
      }

      // Extract relations
      for (const m of content.matchAll(RELATION_RE)) {
        const relName = m[1];
        const fromTable = m[2];
        relations.push({ from: fromTable, name: relName });
      }

      fileEntries.push({ relPath: f.relPath, tables: fileTables.join(", ") || "—" });
    }

    return {
      tables,
      relations,
      files: fileEntries,
      summary: { totalTables: tables.length, totalRelations: relations.length },
    };
  }

  /** Drizzle schema tables list. */
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

  /** Drizzle relations list. */
  relations(analysis, labels) {
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

  /** Schema definition files list. */
  files(analysis, labels) {
    const items = analysis.schema?.files;
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

/**
 * AuthSource — enrich-based DataSource for API authentication/authorization.
 *
 * Reads analysis.api.roles to generate role/permission tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class AuthSource extends DataSource {
  /** Authorization roles table. */
  roles(analysis, labels) {
    const items = analysis.api?.roles;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.name || "—",
      r.permissions || "—",
      r.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Role", "Permissions", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

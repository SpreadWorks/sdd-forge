/**
 * ErrorsSource — enrich-based DataSource for API error codes.
 *
 * Reads analysis.api.errors to generate error code tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class ErrorsSource extends DataSource {
  /** API error codes table. */
  list(analysis, labels) {
    const items = analysis.api?.errors;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (e) => [
      String(e.code || e.status || "—"),
      e.name || "—",
      e.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Code", "Name", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

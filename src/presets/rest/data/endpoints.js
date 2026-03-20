/**
 * EndpointsSource — enrich-based DataSource for REST endpoints.
 *
 * Reads analysis.endpoints to generate endpoint tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class EndpointsSource extends DataSource {
  /** REST endpoint list table. */
  list(analysis, labels) {
    const items = analysis.endpoints?.endpoints;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (e) => [
      e.method || "—",
      e.path || "—",
      e.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Method", "Path", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

/**
 * HonoMiddlewareSource — enrich-based DataSource for Hono middleware.
 *
 * Reads analysis.middleware to generate middleware tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class HonoMiddlewareSource extends DataSource {
  /** Middleware list table. */
  list(analysis, labels) {
    const items = analysis.middleware?.middleware;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.name || "—",
      m.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Middleware", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

/**
 * EdgeRuntimeSource — enrich-based DataSource for edge runtime.
 *
 * Reads analysis.edge to generate entry point and constraint tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class EdgeRuntimeSource extends DataSource {
  /** Edge function entry points table. */
  entryPoints(analysis, labels) {
    const items = analysis.edge?.entryPoints;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (e) => [
      e.name || e.route || "—",
      e.trigger || "—",
      e.file || "—",
      e.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Function", "Trigger", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Runtime constraints table. */
  constraints(analysis, labels) {
    const items = analysis.edge?.constraints;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "—",
      c.value || "—",
      c.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Constraint", "Value", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

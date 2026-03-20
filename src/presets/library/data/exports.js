/**
 * ExportsSource — enrich-based DataSource for library public API.
 *
 * Reads enriched analysis items to generate export/API tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class ExportsSource extends DataSource {
  /** Public API list table. */
  list(analysis, labels) {
    const items = analysis.modules?.modules || [];
    const exports = items.filter((m) => m.role === "lib" || m.chapter === "public_api");
    if (exports.length === 0) return null;
    const merged = this.mergeDesc(exports, "exports", "className");
    const rows = this.toRows(merged, (m) => [
      m.className,
      m.file || m.relPath || "—",
      m.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Name", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Runtime requirements table. */
  runtime(analysis, labels) {
    const reqs = analysis.requirements?.runtime;
    if (!Array.isArray(reqs) || reqs.length === 0) return null;
    const rows = this.toRows(reqs, (r) => [
      r.name,
      r.version || "—",
      r.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Requirement", "Version", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

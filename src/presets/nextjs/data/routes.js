/**
 * RoutesSource — enrich-based DataSource for Next.js routes.
 *
 * Reads analysis.routes to generate route tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class RoutesSource extends DataSource {
  /** App Router structure table. */
  app(analysis, labels) {
    const items = analysis.routes?.app;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.path || "—",
      r.type || "—",
      r.file || r.relPath || "—",
      r.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Path", "Type", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Pages Router structure table. */
  pages(analysis, labels) {
    const items = analysis.routes?.pages;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.path || "—",
      r.dataFetch || "—",
      r.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Page", "Data Fetching", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Dynamic route patterns table. */
  dynamic(analysis, labels) {
    const items = analysis.routes?.dynamic;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.pattern || "—",
      r.params || "—",
      r.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Pattern", "Parameters", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** API route handlers table. */
  handlers(analysis, labels) {
    const items = analysis.routes?.handlers;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.method || "—",
      r.path || "—",
      r.file || r.relPath || "—",
      r.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Method", "Path", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

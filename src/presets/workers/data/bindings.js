/**
 * WorkersBindingsSource — enrich-based DataSource for Cloudflare Workers bindings.
 *
 * Reads analysis.bindings to generate binding and env var tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class WorkersBindingsSource extends DataSource {
  /** Bindings list table (KV, R2, D1, etc.). */
  list(analysis, labels) {
    const items = analysis.bindings?.bindings;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (b) => [
      b.name || "—",
      b.type || "—",
      b.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Name", "Type", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Environment variables and secrets table. */
  env(analysis, labels) {
    const items = analysis.bindings?.env;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (e) => [
      e.name || "—",
      e.type || "—",
      e.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Name", "Type", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Worker entry points table. */
  entryPoints(analysis, labels) {
    const items = analysis.bindings?.entryPoints;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (e) => [
      e.route || e.path || "—",
      e.trigger || "—",
      e.file || "—",
      e.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Route", "Trigger", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Runtime constraints table. */
  constraints(analysis, labels) {
    const items = analysis.bindings?.constraints;
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

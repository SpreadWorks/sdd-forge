/**
 * WorkersBindingsSource — Scannable DataSource for Cloudflare Workers bindings.
 *
 * Scans wrangler.toml / wrangler.json to extract bindings, env vars,
 * entry points, and runtime constraints.
 * Reads analysis.bindings to generate tables.
 */

import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { analyzeBindings } from "../scan/bindings.js";

const WRANGLER_FILES = new Set(["wrangler.toml", "wrangler.json", "wrangler.jsonc"]);

export default class WorkersBindingsSource extends Scannable(DataSource) {
  match(file) {
    return WRANGLER_FILES.has(file.fileName);
  }

  scan(files) {
    const wranglerFile = files.find(
      (f) => f.fileName === "wrangler.toml" || f.fileName === "wrangler.json" || f.fileName === "wrangler.jsonc",
    );
    if (!wranglerFile) return null;

    // Derive project root from the wrangler file's directory
    const projectRoot = path.dirname(wranglerFile.absPath);
    return analyzeBindings(projectRoot);
  }

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

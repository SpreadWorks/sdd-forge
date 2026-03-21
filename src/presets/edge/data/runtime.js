/**
 * EdgeRuntimeSource — Scannable DataSource for edge runtime.
 *
 * Scans wrangler.toml to extract entry points and runtime constraints.
 * Reads analysis.runtime to generate tables.
 */

import fs from "fs";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { parseTOML } from "../../../docs/lib/toml-parser.js";

export default class EdgeRuntimeSource extends Scannable(DataSource) {
  match(file) {
    return file.fileName === "wrangler.toml" || file.fileName === "wrangler.json" || file.fileName === "wrangler.jsonc";
  }

  scan(files) {
    const wranglerFile = files.find(
      (f) => f.fileName === "wrangler.toml" || f.fileName === "wrangler.json" || f.fileName === "wrangler.jsonc",
    );
    if (!wranglerFile) return null;

    const raw = fs.readFileSync(wranglerFile.absPath, "utf8");
    const isToml = wranglerFile.fileName === "wrangler.toml";
    const cfg = isToml ? parseTOML(raw) : JSON.parse(raw);

    // Entry points
    const entryPoints = [];
    const mainEntry = cfg.main || (cfg.build && cfg.build.upload && cfg.build.upload.main);
    if (mainEntry) {
      entryPoints.push({ name: mainEntry, trigger: "fetch", file: mainEntry });
    }

    // Routes
    const routes = cfg.routes || cfg.route;
    if (routes) {
      const routeList = Array.isArray(routes) ? routes : [routes];
      for (const r of routeList) {
        const pattern = typeof r === "string" ? r : r.pattern || r;
        entryPoints.push({ name: String(pattern), trigger: "route", file: mainEntry || "" });
      }
    }

    // Constraints
    const constraints = [];
    if (cfg.compatibility_date) {
      constraints.push({ name: "compatibility_date", value: cfg.compatibility_date });
    }
    if (cfg.compatibility_flags) {
      constraints.push({ name: "compatibility_flags", value: cfg.compatibility_flags.join(", ") });
    }
    if (cfg.node_compat !== undefined) {
      constraints.push({ name: "node_compat", value: String(cfg.node_compat) });
    }

    return {
      entryPoints,
      constraints,
      summary: {
        totalEntryPoints: entryPoints.length,
        totalConstraints: constraints.length,
      },
    };
  }

  /** Edge function entry points table. */
  entryPoints(analysis, labels) {
    const items = analysis.runtime?.entryPoints;
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
    const items = analysis.runtime?.constraints;
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

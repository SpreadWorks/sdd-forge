/**
 * WorkersBindingsSource — Scannable DataSource for Cloudflare Workers bindings.
 *
 * Scans wrangler.toml / wrangler.json to extract bindings, env vars,
 * entry points, and runtime constraints.
 * Reads analysis.bindings to generate tables.
 */

import fs from "fs";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { parseTOML } from "../../../docs/lib/toml-parser.js";

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

    const raw = fs.readFileSync(wranglerFile.absPath, "utf8");
    const isToml = wranglerFile.fileName === "wrangler.toml";
    const cfg = isToml ? parseTOML(raw) : JSON.parse(raw);

    const bindings = [];

    // KV namespaces
    const kvNamespaces = cfg.kv_namespaces || [];
    for (const kv of kvNamespaces) {
      bindings.push({ name: kv.binding, type: "KV Namespace", id: kv.id || "" });
    }

    // R2 buckets
    const r2Buckets = cfg.r2_buckets || [];
    for (const r2 of r2Buckets) {
      bindings.push({ name: r2.binding, type: "R2 Bucket", id: r2.bucket_name || "" });
    }

    // D1 databases
    const d1Databases = cfg.d1_databases || [];
    for (const d1 of d1Databases) {
      bindings.push({ name: d1.binding, type: "D1 Database", id: d1.database_id || "" });
    }

    // Service bindings
    const services = cfg.services || [];
    for (const svc of services) {
      bindings.push({ name: svc.binding, type: "Service", id: svc.service || "" });
    }

    // Durable Objects
    const durableObjects = cfg.durable_objects?.bindings || [];
    for (const dobj of durableObjects) {
      bindings.push({ name: dobj.name, type: "Durable Object", id: dobj.class_name || "" });
    }

    // Environment variables (vars section)
    const vars = cfg.vars || {};
    const env = Object.entries(vars).map(([name, value]) => ({
      name,
      type: typeof value,
      value: String(value),
    }));

    // Entry points
    const entryPoints = [];
    const mainEntry = cfg.main || (cfg.build && cfg.build.upload && cfg.build.upload.main);
    if (mainEntry) {
      entryPoints.push({ path: mainEntry, trigger: "fetch", file: mainEntry });
    }

    // Routes / triggers
    const routes = cfg.routes || cfg.route;
    if (routes) {
      const routeList = Array.isArray(routes) ? routes : [routes];
      for (const r of routeList) {
        const pattern = typeof r === "string" ? r : r.pattern || r;
        entryPoints.push({ route: String(pattern), trigger: "route", file: mainEntry || "" });
      }
    }

    // Scheduled triggers
    const triggers = cfg.triggers;
    if (triggers && triggers.crons) {
      for (const cron of triggers.crons) {
        entryPoints.push({ route: cron, trigger: "cron", file: mainEntry || "" });
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
      bindings,
      env,
      entryPoints,
      constraints,
      summary: {
        totalBindings: bindings.length,
        totalEnvVars: env.length,
        totalEntryPoints: entryPoints.length,
      },
    };
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

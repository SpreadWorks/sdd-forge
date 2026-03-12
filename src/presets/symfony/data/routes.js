/**
 * RoutesSource — Symfony routes DataSource.
 *
 * Extends the webapp parent RoutesSource with Symfony-specific
 * scan logic and resolve methods.
 *
 * Available methods (called via {{data}} directives):
 *   routes.list("Methods|Path|Controller|Name")
 *   routes.attribute("Methods|Path|Controller|Name")
 *   routes.yaml("Methods|Path|Controller|Name")
 */

import RoutesSource from "../../webapp/data/routes.js";
import { analyzeRoutes } from "../scan/routes.js";

function deriveSourceRoot(files) {
  const f = files[0];
  return f.absPath.slice(0, f.absPath.length - f.relPath.length).replace(/\/$/, "");
}

export default class SymfonyRoutesSource extends RoutesSource {
  match(file) {
    return file.relPath.startsWith("config/routes") && /\.(yaml|yml|xml|php)$/.test(file.fileName);
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = deriveSourceRoot(files);
    const result = analyzeRoutes(sourceRoot);
    return { symfonyRoutes: result.routes, symfonyRoutesSummary: result.summary };
  }

  /** All routes table. */
  list(analysis, labels) {
    const routes = analysis.routes?.symfonyRoutes || [];
    if (routes.length === 0) return null;
    const rows = this.toRows(routes, (r) => [
      (r.methods || []).join("|") || "*",
      r.path,
      r.controller,
      r.name || "",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Attribute-defined routes table. */
  attribute(analysis, labels) {
    const routes = (analysis.routes?.symfonyRoutes || []).filter(
      (r) => r.source === "attribute",
    );
    if (routes.length === 0) return null;
    const rows = this.toRows(routes, (r) => [
      (r.methods || []).join("|") || "*",
      r.path,
      r.controller,
      r.name || "",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** YAML-defined routes table. */
  yaml(analysis, labels) {
    const routes = (analysis.routes?.symfonyRoutes || []).filter(
      (r) => r.source === "yaml",
    );
    if (routes.length === 0) return null;
    const rows = this.toRows(routes, (r) => [
      (r.methods || []).join("|") || "*",
      r.path,
      r.controller,
      r.name || "",
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

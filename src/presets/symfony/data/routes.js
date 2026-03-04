/**
 * RoutesSource — Symfony routes DataSource.
 *
 * Combines scan (source code extraction) and resolve (Markdown rendering)
 * into a single self-contained class.
 *
 * Available methods (called via @data directives):
 *   routes.list("Methods|Path|Controller|Name")
 *   routes.attribute("Methods|Path|Controller|Name")
 *   routes.yaml("Methods|Path|Controller|Name")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { analyzeRoutes } from "../scan/routes.js";

class RoutesSource extends DataSource {
  scan(sourceRoot) {
    return analyzeRoutes(sourceRoot);
  }

  /** All routes table. */
  list(analysis, labels) {
    const routes = analysis.extras?.symfonyRoutes || [];
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
    const routes = (analysis.extras?.symfonyRoutes || []).filter(
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
    const routes = (analysis.extras?.symfonyRoutes || []).filter(
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

export default new RoutesSource();

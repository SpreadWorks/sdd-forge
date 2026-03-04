/**
 * RoutesSource — Laravel routes DataSource.
 *
 * Combines scan (source code extraction) and resolve (Markdown rendering)
 * into a single self-contained class.
 *
 * Available methods (called via @data directives):
 *   routes.list("Method|URI|Controller|Action")
 *   routes.api("Method|URI|Controller|Action")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { analyzeRoutes } from "../scan/routes.js";

class RoutesSource extends DataSource {
  scan(sourceRoot) {
    return analyzeRoutes(sourceRoot);
  }

  /** All routes table. */
  list(analysis, labels) {
    const routes = analysis.extras?.laravelRoutes || [];
    if (routes.length === 0) return null;
    const rows = this.toRows(routes, (r) => [
      r.httpMethod,
      r.uri,
      r.controller,
      r.action,
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** API routes only. */
  api(analysis, labels) {
    const routes = analysis.extras?.laravelRoutes || [];
    const apiRoutes = routes.filter((r) => r.routeType === "api");
    if (apiRoutes.length === 0) return null;
    const rows = this.toRows(apiRoutes, (r) => [
      r.httpMethod,
      r.uri,
      r.controller,
      r.action,
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

export default new RoutesSource();

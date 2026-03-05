/**
 * RoutesSource — Laravel routes DataSource.
 *
 * Extends the webapp parent RoutesSource with Laravel-specific
 * scan logic and resolve methods.
 *
 * Available methods (called via @data directives):
 *   routes.list("Method|URI|Controller|Action")
 *   routes.api("Method|URI|Controller|Action")
 */

import RoutesSource from "../../webapp/data/routes.js";
import { analyzeRoutes } from "../scan/routes.js";

export default class LaravelRoutesSource extends RoutesSource {
  scan(sourceRoot, scanCfg) {
    const result = analyzeRoutes(sourceRoot);
    return { laravelRoutes: result.routes, laravelRoutesSummary: result.summary };
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

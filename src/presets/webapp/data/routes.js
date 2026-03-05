/**
 * RoutesSource — webapp common routes scan + resolve.
 *
 * Child presets extend this class to add FW-specific route parsing
 * and resolve methods.
 */

import fs from "fs";
import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";

export default class RoutesSource extends Scannable(DataSource) {
  scan(sourceRoot, scanCfg) {
    const cfg = scanCfg.routes;
    if (!cfg) return { routes: [], summary: { total: 0, controllers: [] } };

    const filePath = path.join(sourceRoot, cfg.file);
    if (!fs.existsSync(filePath)) {
      return { routes: [], summary: { total: 0, controllers: [] } };
    }

    const content = fs.readFileSync(filePath, "utf8");
    const routes = [];
    const controllersSet = new Set();

    if (cfg.lang === "php") {
      const routeRegex =
        /(?:Router::connect|Route::(?:get|post|put|delete|any|match))\s*\(\s*['"]([^'"]+)['"]/g;
      let m;
      while ((m = routeRegex.exec(content)) !== null) {
        const pattern = m[1];
        const ctrlMatch = content
          .slice(m.index, m.index + 500)
          .match(/['"]controller['"]\s*=>\s*['"](\w+)['"]/);
        const actionMatch = content
          .slice(m.index, m.index + 500)
          .match(/['"]action['"]\s*=>\s*['"](\w+)['"]/);

        const controller = ctrlMatch ? ctrlMatch[1] : "";
        const action = actionMatch ? actionMatch[1] : "";

        if (controller) controllersSet.add(controller);
        routes.push({
          pattern,
          controller,
          action,
          raw: content.slice(m.index, content.indexOf("\n", m.index)).trim(),
        });
      }
    }

    return {
      routes,
      summary: { total: routes.length, controllers: [...controllersSet] },
    };
  }

  /** Route list table. */
  list(analysis, labels) {
    const routes = analysis.routes?.routes || [];
    if (routes.length === 0) return null;
    const rows = this.toRows(routes, (r) => [
      r.pattern,
      r.controller,
      r.action,
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

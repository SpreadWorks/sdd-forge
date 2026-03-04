#!/usr/bin/env node
/**
 * tools/analyzers/analyze-routes.js
 *
 * app/Config/routes.php を読み込み、
 * Router::connect() パターンを抽出する。
 */

import fs from "fs";
import path from "path";
import { stripBlockComments } from "../../docs/lib/php-array-parser.js";

export function analyzeRoutes(appDir) {
  const routesPath = path.join(appDir, "Config", "routes.php");
  if (!fs.existsSync(routesPath)) return { routes: [], summary: {} };

  const raw = fs.readFileSync(routesPath, "utf8");
  const src = stripBlockComments(raw);

  const routes = [];
  const re =
    /Router::connect\s*\(\s*['"]([^'"]*)['"]\s*,\s*array\s*\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const pattern = m[1];
    const paramsStr = m[2];

    const controllerMatch = paramsStr.match(
      /['"]controller['"]\s*=>\s*['"](\w+)['"]/,
    );
    const actionMatch = paramsStr.match(
      /['"]action['"]\s*=>\s*['"](\w+)['"]/,
    );

    routes.push({
      pattern,
      controller: controllerMatch ? controllerMatch[1] : null,
      action: actionMatch ? actionMatch[1] : null,
      raw: `Router::connect('${pattern}', array(${paramsStr.trim()}))`,
    });
  }

  return {
    routes,
    summary: {
      total: routes.length,
      controllers: [...new Set(routes.map((r) => r.controller).filter(Boolean))],
    },
  };
}

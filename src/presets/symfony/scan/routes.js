/**
 * Symfony ルート解析器。
 * config/routes.yaml, config/routes/ ディレクトリから YAML ルート定義を抽出し、
 * src/Controller/ 内の #[Route] attribute からもルート情報を収集する。
 */

import fs from "fs";
import path from "path";
import { findFiles } from "../../../docs/lib/scanner.js";
import { findMethodsWithAttributes } from "./php-attributes.js";

/**
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {{ routes: Object[], summary: { total: number, yamlRoutes: number, attributeRoutes: number } }}
 */
export function analyzeRoutes(sourceRoot) {
  const routes = [];

  // 1. YAML ルート定義
  const yamlRoutes = parseYamlRoutes(sourceRoot);
  routes.push(...yamlRoutes);

  // 2. Controller の #[Route] attribute からルートを収集
  const attrRoutes = parseAttributeRoutes(sourceRoot);
  routes.push(...attrRoutes);

  return {
    routes,
    summary: {
      total: routes.length,
      yamlRoutes: yamlRoutes.length,
      attributeRoutes: attrRoutes.length,
    },
  };
}

function parseYamlRoutes(sourceRoot) {
  const routes = [];
  const routeFiles = [];

  // config/routes.yaml
  const mainRoute = path.join(sourceRoot, "config", "routes.yaml");
  if (fs.existsSync(mainRoute)) routeFiles.push(mainRoute);

  // config/routes/*.yaml
  const routesDir = path.join(sourceRoot, "config", "routes");
  if (fs.existsSync(routesDir)) {
    for (const f of fs.readdirSync(routesDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).sort()) {
      routeFiles.push(path.join(routesDir, f));
    }
  }

  for (const filePath of routeFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    routes.push(...parseYamlContent(content));
  }

  return routes;
}

/**
 * 簡易 YAML パーサ — Symfony route YAML の主要パターンを解析する。
 * フル YAML パーサは使わず、regex ベースで抽出する。
 */
function parseYamlContent(content) {
  const routes = [];
  const lines = content.split("\n");

  let currentRoute = null;
  let inController = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // トップレベルルート名（インデントなし、コロンで終わる）
    const routeNameMatch = line.match(/^(\w[\w._-]*):\s*$/);
    if (routeNameMatch) {
      if (currentRoute && currentRoute.path) routes.push(currentRoute);
      currentRoute = { name: routeNameMatch[1], path: "", controller: "", methods: [], source: "yaml" };
      inController = false;
      continue;
    }

    // インラインルート定義: route_name: { path: /xxx, controller: ... }
    const inlineMatch = line.match(/^(\w[\w._-]*):\s*\{(.+)\}\s*$/);
    if (inlineMatch) {
      if (currentRoute && currentRoute.path) routes.push(currentRoute);
      const name = inlineMatch[1];
      const body = inlineMatch[2];
      const pathMatch = body.match(/path:\s*([^\s,}]+)/);
      const ctrlMatch = body.match(/controller:\s*([^\s,}]+)/);
      currentRoute = {
        name,
        path: pathMatch ? pathMatch[1] : "",
        controller: ctrlMatch ? ctrlMatch[1] : "",
        methods: [],
        source: "yaml",
      };
      continue;
    }

    if (!currentRoute) continue;

    // path: /xxx
    const pathMatch = trimmed.match(/^path:\s*(.+)/);
    if (pathMatch) {
      currentRoute.path = pathMatch[1].trim();
      continue;
    }

    // controller: App\Controller\XxxController::method
    const ctrlMatch = trimmed.match(/^controller:\s*(.+)/);
    if (ctrlMatch) {
      currentRoute.controller = ctrlMatch[1].trim();
      inController = true;
      continue;
    }

    // methods: GET|POST or methods: [GET, POST]
    const methodsMatch = trimmed.match(/^methods:\s*(.+)/);
    if (methodsMatch) {
      const val = methodsMatch[1].trim();
      if (val.startsWith("[")) {
        currentRoute.methods = val.replace(/[\[\]]/g, "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      } else {
        currentRoute.methods = val.split("|").map((s) => s.trim().toUpperCase()).filter(Boolean);
      }
    }

    // resource/prefix patterns (type: annotation/attribute)
    const typeMatch = trimmed.match(/^type:\s*(annotation|attribute)/);
    if (typeMatch) {
      // This is a controller import, not a specific route
      if (currentRoute) {
        currentRoute = null;
      }
    }
  }

  if (currentRoute && currentRoute.path) routes.push(currentRoute);

  return routes;
}

function parseAttributeRoutes(sourceRoot) {
  const controllerDir = path.join(sourceRoot, "src", "Controller");
  if (!fs.existsSync(controllerDir)) return [];

  const files = findFiles(controllerDir, "*.php", [], true);
  const routes = [];
  for (const f of files) {
    const content = fs.readFileSync(f.absPath, "utf8");
    if (/#\[Route/.test(content)) {
      routes.push(...extractAttributeRoutes(content));
    }
  }
  return routes;
}

function extractAttributeRoutes(content) {
  const routes = [];

  // クラスレベル #[Route] prefix
  const classRouteMatch = content.match(/#\[Route\s*\(\s*['"]([^'"]*)['"]/);
  const classPrefix = classRouteMatch ? classRouteMatch[1] : "";

  // クラス名
  const classMatch = content.match(/class\s+(\w+)/);
  const controllerName = classMatch ? classMatch[1] : "";

  // Two-step approach to avoid catastrophic backtracking (Issue #1)
  const methodMatches = findMethodsWithAttributes(content);
  for (const { methodName, attrBlock } of methodMatches) {
    if (methodName === "__construct" || methodName.startsWith("_")) continue;

    const routeAttrRegex = /#\[Route\s*\(\s*['"]([^'"]*)['"]\s*(?:,\s*(?:name:\s*['"]([^'"]*)['"]\s*)?(?:,?\s*methods:\s*\[([^\]]*)\])?)?\s*\)/g;
    let rm;
    while ((rm = routeAttrRegex.exec(attrBlock)) !== null) {
      const routePath = rm[1];
      const routeName = rm[2] || "";
      const methods = rm[3]
        ? rm[3].match(/['"](\w+)['"]/g)?.map((s) => s.replace(/['"]/g, "").toUpperCase()) || ["GET"]
        : ["GET"];

      routes.push({
        name: routeName,
        path: classPrefix + routePath,
        controller: controllerName ? `${controllerName}::${methodName}` : methodName,
        methods,
        source: "attribute",
      });
    }
  }

  return routes;
}

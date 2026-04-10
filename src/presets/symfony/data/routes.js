/**
 * RoutesSource — Symfony routes DataSource.
 *
 * Extends the webapp parent RoutesSource with Symfony-specific
 * parse logic and resolve methods.
 *
 * Symfony routes come from two sources:
 * - YAML config files (config/routes*.yaml)
 * - PHP #[Route] attributes on controllers
 *
 * parse() handles YAML route files. Attribute routes are extracted
 * by the controllers DataSource.
 *
 * Available methods (called via {{data}} directives):
 *   routes.list("Methods|Path|Controller|Name")
 *   routes.attribute("Methods|Path|Controller|Name")
 *   routes.yaml("Methods|Path|Controller|Name")
 */

import fs from "fs";
import path from "path";
import RoutesSource from "../../webapp/data/routes.js";
import { RouteEntry } from "../../webapp/data/routes.js";
import { findFiles } from "../../../docs/lib/scanner.js";
import { hasPathPrefix } from "../../lib/path-match.js";

export class SymfonyRouteEntry extends RouteEntry {
  name = null;
  methods = null;
  source = null;

  static summary = {};
}

export default class SymfonyRoutesSource extends RoutesSource {
  static Entry = SymfonyRouteEntry;

  match(relPath) {
    return hasPathPrefix(relPath, "config/routes") && /\.(yaml|yml|xml|php)$/.test(relPath);
  }

  parse(absPath) {
    const entry = new SymfonyRouteEntry();
    const content = fs.readFileSync(absPath, "utf8");

    // Parse YAML route definitions from the file
    const routes = parseYamlContent(content);

    // For the entry-per-file model, store the first route's data
    // (multi-route files will produce partial data; the main route
    // inventory comes from the flat routes list below)
    if (routes.length > 0) {
      const first = routes[0];
      entry.pattern = first.path;
      entry.controller = first.controller;
      entry.action = "";
      entry.raw = `${first.name}: ${first.path}`;
      entry.name = first.name;
      entry.methods = first.methods;
      entry.source = "yaml";
    }

    return entry;
  }

  /** All routes table. */
  list(analysis, labels) {
    const routes = analysis.routes?.entries || [];
    if (routes.length === 0) return null;
    const rows = this.toRows(routes, (r) => [
      (r.methods || []).join("|") || "*",
      r.pattern || r.path || "",
      r.controller,
      r.name || "",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Attribute-defined routes table. */
  attribute(analysis, labels) {
    const routes = (analysis.routes?.entries || []).filter(
      (r) => r.source === "attribute",
    );
    if (routes.length === 0) return null;
    const rows = this.toRows(routes, (r) => [
      (r.methods || []).join("|") || "*",
      r.pattern || r.path || "",
      r.controller,
      r.name || "",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** YAML-defined routes table. */
  yaml(analysis, labels) {
    const routes = (analysis.routes?.entries || []).filter(
      (r) => r.source === "yaml",
    );
    if (routes.length === 0) return null;
    const rows = this.toRows(routes, (r) => [
      (r.methods || []).join("|") || "*",
      r.pattern || r.path || "",
      r.controller,
      r.name || "",
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

/**
 * Simple YAML parser for Symfony route YAML patterns.
 * Uses regex-based extraction (no full YAML parser).
 */
function parseYamlContent(content) {
  const routes = [];
  const lines = content.split("\n");

  let currentRoute = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Top-level route name (no indent, ends with colon)
    const routeNameMatch = line.match(/^(\w[\w._-]*):\s*$/);
    if (routeNameMatch) {
      if (currentRoute && currentRoute.path) routes.push(currentRoute);
      currentRoute = { name: routeNameMatch[1], path: "", controller: "", methods: [], source: "yaml" };
      continue;
    }

    // Inline route: route_name: { path: /xxx, controller: ... }
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

    // type: annotation/attribute — controller import, not a specific route
    const typeMatch = trimmed.match(/^type:\s*(annotation|attribute)/);
    if (typeMatch) {
      currentRoute = null;
    }
  }

  if (currentRoute && currentRoute.path) routes.push(currentRoute);

  return routes;
}

// ---------------------------------------------------------------------------
// Directory-level analyzer (moved from scan/routes.js, used by tests)
// ---------------------------------------------------------------------------

const SCAN_METHOD_RE = /public\s+function\s+(\w+)\s*\(/g;
const SCAN_ATTR_LINE_RE = /^\s*#\[/;

/** Find all public methods with their preceding attribute blocks (scan-level helper). */
function findMethodsWithAttributesScan(content) {
  const lines = content.split("\n");
  const lineOffsets = [];
  let offset = 0;
  for (const line of lines) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  }

  function offsetToLine(pos) {
    let lo = 0;
    let hi = lineOffsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineOffsets[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  const results = [];
  let m;
  while ((m = SCAN_METHOD_RE.exec(content)) !== null) {
    const methodName = m[1];
    const methodLineIdx = offsetToLine(m.index);
    const attrLines = [];
    for (let i = methodLineIdx - 1; i >= 0; i--) {
      const line = lines[i];
      const trimmed = line.trim();
      if (SCAN_ATTR_LINE_RE.test(line)) {
        attrLines.unshift(line);
        continue;
      }
      if (trimmed === "") break;
      break;
    }
    results.push({ methodName, attrBlock: attrLines.join("\n") });
  }
  return results;
}

/**
 * @param {string} sourceRoot
 * @returns {{ routes: Object[], summary: { total: number, yamlRoutes: number, attributeRoutes: number } }}
 */
export function analyzeRoutes(sourceRoot) {
  const routes = [];

  // 1. YAML route definitions
  const yamlRoutes = parseScanYamlRoutes(sourceRoot);
  routes.push(...yamlRoutes);

  // 2. Controller #[Route] attributes
  const attrRoutes = parseScanAttributeRoutes(sourceRoot);
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

function parseScanYamlRoutes(sourceRoot) {
  const routes = [];
  const routeFiles = [];

  const mainRoute = path.join(sourceRoot, "config", "routes.yaml");
  if (fs.existsSync(mainRoute)) routeFiles.push(mainRoute);

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

function parseScanAttributeRoutes(sourceRoot) {
  const controllerDir = path.join(sourceRoot, "src", "Controller");
  if (!fs.existsSync(controllerDir)) return [];

  const files = findFiles(controllerDir, "*.php", [], true);
  const routes = [];
  for (const f of files) {
    const content = fs.readFileSync(f.absPath, "utf8");
    if (/#\[Route/.test(content)) {
      routes.push(...extractScanAttributeRoutes(content));
    }
  }
  return routes;
}

function extractScanAttributeRoutes(content) {
  const routes = [];

  const classRouteMatch = content.match(/#\[Route\s*\(\s*['"]([^'"]*)['"]/);
  const classPrefix = classRouteMatch ? classRouteMatch[1] : "";

  const classMatch = content.match(/class\s+(\w+)/);
  const controllerName = classMatch ? classMatch[1] : "";

  const methodMatches = findMethodsWithAttributesScan(content);
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

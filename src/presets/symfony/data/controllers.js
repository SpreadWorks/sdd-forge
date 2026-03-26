/**
 * ControllersSource — Symfony controllers DataSource.
 *
 * Extends the webapp parent ControllersSource with Symfony-specific
 * parse logic and resolve methods.
 *
 * Available methods (called via {{data}} directives):
 *   controllers.list("Name|File|Description")
 *   controllers.actions("Controller|Action")
 *   controllers.di("Controller|Dependency")
 */

import fs from "fs";
import path from "path";
import ControllersSource from "../../webapp/data/controllers.js";
import { ControllerEntry } from "../../webapp/data/controllers.js";
import { findFiles } from "../../../docs/lib/scanner.js";

const METHOD_RE = /public\s+function\s+(\w+)\s*\(/g;
const ATTR_LINE_RE = /^\s*#\[/;

/** Find all public methods with their preceding attribute blocks. */
function findMethodsWithAttributes(content) {
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
  while ((m = METHOD_RE.exec(content)) !== null) {
    const methodName = m[1];
    const methodLineIdx = offsetToLine(m.index);
    const attrLines = [];
    for (let i = methodLineIdx - 1; i >= 0; i--) {
      const line = lines[i];
      const trimmed = line.trim();
      if (ATTR_LINE_RE.test(line)) {
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

export default class SymfonyControllersSource extends ControllersSource {
  static Entry = ControllerEntry;

  match(relPath) {
    return relPath.endsWith(".php") && relPath.startsWith("src/Controller/");
  }

  parse(absPath) {
    const entry = new ControllerEntry();
    const content = fs.readFileSync(absPath, "utf8");

    const classMatch = content.match(/class\s+(\w+)\s+(?:extends\s+(\w+))?/);
    entry.className = classMatch ? classMatch[1] : path.basename(absPath, ".php");
    entry.parentClass = classMatch && classMatch[2] ? classMatch[2] : "";

    // Class-level #[Route] prefix
    const classRouteMatch = content.match(/#\[Route\s*\(\s*['"]([^'"]*)['"]/);
    const classRoutePrefix = classRouteMatch ? classRouteMatch[1] : "";

    // Public methods (actions) with #[Route] attributes
    const actions = [];
    const methodMatches = findMethodsWithAttributes(content);
    for (const { methodName, attrBlock } of methodMatches) {
      if (methodName === "__construct" || methodName.startsWith("_")) continue;

      const routes = [];
      const routeAttrRegex = /#\[Route\s*\(\s*['"]([^'"]*)['"]\s*(?:,\s*(?:name:\s*['"]([^'"]*)['"]\s*)?(?:,?\s*methods:\s*\[([^\]]*)\])?)?\s*\)/g;
      let rm;
      while ((rm = routeAttrRegex.exec(attrBlock)) !== null) {
        const routePath = rm[1];
        const routeName = rm[2] || "";
        const methods = rm[3]
          ? rm[3].match(/['"](\w+)['"]/g)?.map((s) => s.replace(/['"]/g, "")) || ["GET"]
          : ["GET"];
        routes.push({ path: classRoutePrefix + routePath, name: routeName, methods });
      }

      actions.push({ name: methodName, routes });
    }
    entry.actions = actions;

    // Constructor DI dependencies
    const diDeps = [];
    const ctorMatch = content.match(/public\s+function\s+__construct\s*\(([^)]*)\)/s);
    if (ctorMatch) {
      const depRegex = /(?:private|protected|public)?\s*(?:readonly\s+)?(\w+)\s+\$\w+/g;
      let dm;
      while ((dm = depRegex.exec(ctorMatch[1])) !== null) {
        const typeName = dm[1];
        if (!["Request", "array", "string", "int", "bool", "float"].includes(typeName)) {
          diDeps.push(typeName);
        }
      }
    }

    entry.components = diDeps;
    entry.uses = [];

    return entry;
  }

  /** Controller list table. */
  list(analysis, labels) {
    const ctrls = this.mergeDesc(analysis.controllers?.entries || [], "controllers");
    if (ctrls.length === 0) return null;
    const rows = this.toRows(ctrls, (c) => [
      c.className,
      c.file,
      c.summary || "\u2014",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Controller actions table. */
  actions(analysis, labels) {
    const ctrls = analysis.controllers?.entries || [];
    if (ctrls.length === 0) return null;
    const rows = [];
    for (const c of ctrls) {
      for (const action of c.actions || []) {
        rows.push([c.className, typeof action === "string" ? action : action.name]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Controller DI dependencies table. */
  di(analysis, labels) {
    const ctrls = analysis.controllers?.entries || [];
    if (ctrls.length === 0) return null;
    const rows = [];
    for (const c of ctrls) {
      for (const dep of c.components || []) {
        rows.push([c.className, dep]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzer (moved from scan/controllers.js, used by tests)
// ---------------------------------------------------------------------------

/**
 * @param {string} sourceRoot
 * @returns {{ controllers: Object[], summary: { total: number, totalActions: number } }}
 */
export function analyzeControllers(sourceRoot) {
  const baseDir = path.join(sourceRoot, "src", "Controller");
  if (!fs.existsSync(baseDir)) return { controllers: [], summary: { total: 0, totalActions: 0 } };

  const files = findFiles(baseDir, "*.php", [".gitkeep"], true);
  const controllers = files.map((f) => ({
    ...parseControllerFile(f.absPath, f.relPath),
    lines: f.lines, hash: f.hash, mtime: f.mtime,
  }));

  const totalActions = controllers.reduce((s, c) => s + c.actions.length, 0);
  return { controllers, summary: { total: controllers.length, totalActions } };
}

function parseControllerFile(filePath, relPath) {
  const content = fs.readFileSync(filePath, "utf8");

  const classMatch = content.match(/class\s+(\w+)\s+(?:extends\s+(\w+))?/);
  const className = classMatch ? classMatch[1] : path.basename(filePath, ".php");
  const parentClass = classMatch && classMatch[2] ? classMatch[2] : "";

  const classRouteMatch = content.match(/#\[Route\s*\(\s*['"]([^'"]*)['"]/);
  const classRoutePrefix = classRouteMatch ? classRouteMatch[1] : "";

  const actions = [];
  const methodMatches = findMethodsWithAttributes(content);
  for (const { methodName, attrBlock } of methodMatches) {
    if (methodName === "__construct" || methodName.startsWith("_")) continue;

    const routes = [];
    const routeAttrRegex = /#\[Route\s*\(\s*['"]([^'"]*)['"]\s*(?:,\s*(?:name:\s*['"]([^'"]*)['"]\s*)?(?:,?\s*methods:\s*\[([^\]]*)\])?)?\s*\)/g;
    let rm;
    while ((rm = routeAttrRegex.exec(attrBlock)) !== null) {
      const routePath = rm[1];
      const routeName = rm[2] || "";
      const methods = rm[3]
        ? rm[3].match(/['"](\w+)['"]/g)?.map((s) => s.replace(/['"]/g, "")) || ["GET"]
        : ["GET"];
      routes.push({ path: classRoutePrefix + routePath, name: routeName, methods });
    }

    actions.push({ name: methodName, routes });
  }

  // Constructor DI
  const diDeps = [];
  const ctorMatch = content.match(/public\s+function\s+__construct\s*\(([^)]*)\)/s);
  if (ctorMatch) {
    const depRegex = /(?:private|protected|public)?\s*(?:readonly\s+)?(\w+)\s+\$\w+/g;
    let dm;
    while ((dm = depRegex.exec(ctorMatch[1])) !== null) {
      const typeName = dm[1];
      if (!["Request", "array", "string", "int", "bool", "float"].includes(typeName)) {
        diDeps.push(typeName);
      }
    }
  }

  return {
    file: path.join("src/Controller", relPath),
    className,
    parentClass,
    actions,
    diDeps,
    classRoutePrefix,
  };
}

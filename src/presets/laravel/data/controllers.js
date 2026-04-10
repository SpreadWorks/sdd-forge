/**
 * ControllersSource — Laravel controllers DataSource.
 *
 * Extends the webapp parent ControllersSource with Laravel-specific
 * parse logic and resolve methods.
 *
 * Available methods (called via {{data}} directives):
 *   controllers.list("Name|File|Description")
 *   controllers.actions("Controller|Action")
 *   controllers.middleware("Middleware|Controllers")
 */

import fs from "fs";
import path from "path";
import ControllersSource from "../../webapp/data/controllers.js";
import { ControllerEntry } from "../../webapp/data/controllers.js";
import { findFiles } from "../../../docs/lib/scanner.js";
import { hasPathPrefix } from "../../lib/path-match.js";

export class LaravelControllerEntry extends ControllerEntry {
  diDeps = null;
  middleware = null;
}

// ---------------------------------------------------------------------------
// Shared parse helper (used by both parse() and analyzeControllers())
// ---------------------------------------------------------------------------

const SKIP_DI_TYPES = new Set(["Request", "array", "string", "int", "bool"]);

/**
 * Parse Laravel controller content string and return raw parse result.
 * No file I/O — caller provides content.
 *
 * @param {string} content - PHP source code
 * @returns {{ className: string|null, parentClass: string, actions: string[], diDeps: string[], middleware: string[] }}
 */
function parseControllerContent(content) {
  const classMatch = content.match(/class\s+(\w+)\s+extends\s+(\w+)/);
  const className = classMatch ? classMatch[1] : null;
  const parentClass = classMatch ? classMatch[2] : "";

  // Public methods (actions)
  const methodRegex = /public\s+function\s+(\w+)\s*\(/g;
  const actions = [];
  let m;
  while ((m = methodRegex.exec(content)) !== null) {
    if (m[1] !== "__construct" && !m[1].startsWith("_")) {
      actions.push(m[1]);
    }
  }

  // Constructor DI
  const diDeps = [];
  const ctorMatch = content.match(
    /public\s+function\s+__construct\s*\(([^)]*)\)/s,
  );
  if (ctorMatch) {
    const depRegex = /(\w+)\s+\$\w+/g;
    let dm;
    while ((dm = depRegex.exec(ctorMatch[1])) !== null) {
      if (!SKIP_DI_TYPES.has(dm[1])) diDeps.push(dm[1]);
    }
  }

  // middleware() calls
  const middleware = [];
  const mwRegex = /\$this->middleware\(\s*['"]([^'"]+)['"]/g;
  while ((m = mwRegex.exec(content)) !== null) {
    middleware.push(m[1]);
  }

  return { className, parentClass, actions, diDeps, middleware };
}

export default class LaravelControllersSource extends ControllersSource {
  static Entry = LaravelControllerEntry;

  match(relPath) {
    return (
      hasPathPrefix(relPath, "app/Http/Controllers/") &&
      relPath.endsWith(".php") &&
      !relPath.endsWith("/Controller.php")
    );
  }

  parse(absPath) {
    const entry = new LaravelControllerEntry();
    const content = fs.readFileSync(absPath, "utf8");
    const parsed = parseControllerContent(content);

    entry.className = parsed.className;
    entry.parentClass = parsed.parentClass;
    entry.actions = parsed.actions;
    entry.diDeps = parsed.diDeps;
    entry.middleware = parsed.middleware;
    entry.components = [];
    entry.uses = parsed.diDeps;

    return entry;
  }

  /** Controller list table. */
  list(analysis, labels) {
    const ctrls = this.mergeDesc(
      analysis.controllers?.entries || [],
      "controllers",
    );
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
        rows.push([c.className, action]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Middleware usage across controllers. */
  middleware(analysis, labels) {
    const ctrls = analysis.controllers?.entries || [];
    if (ctrls.length === 0) return null;
    const mwMap = new Map();
    for (const c of ctrls) {
      for (const mw of c.middleware || []) {
        if (!mwMap.has(mw)) mwMap.set(mw, []);
        mwMap.get(mw).push(c.className);
      }
    }
    if (mwMap.size === 0) return null;
    const rows = [...mwMap.entries()].map(([mw, controllers]) => [
      mw,
      controllers.join(", "),
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzer (moved from scan/controllers.js, used by tests)
// ---------------------------------------------------------------------------

export function analyzeControllers(sourceRoot) {
  const baseDir = path.join(sourceRoot, "app", "Http", "Controllers");
  if (!fs.existsSync(baseDir)) return { controllers: [], summary: { total: 0, totalActions: 0 } };

  const files = findFiles(baseDir, "*.php", ["Controller.php"], true);
  const controllers = files.map((f) => {
    const content = fs.readFileSync(f.absPath, "utf8");
    const parsed = parseControllerContent(content);
    return {
      file: path.join("app/Http/Controllers", f.relPath),
      className: parsed.className ?? path.basename(f.absPath, ".php"),
      parentClass: parsed.parentClass,
      actions: parsed.actions,
      diDeps: parsed.diDeps,
      middleware: parsed.middleware,
      lines: f.lines, hash: f.hash, mtime: f.mtime,
    };
  });

  const totalActions = controllers.reduce((s, c) => s + c.actions.length, 0);
  return { controllers, summary: { total: controllers.length, totalActions } };
}

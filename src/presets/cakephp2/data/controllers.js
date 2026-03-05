/**
 * ControllersSource — CakePHP 2.x controllers DataSource.
 *
 * Extends webapp ControllersSource with CakePHP-specific scan logic
 * and resolve methods (csv, actions).
 *
 * Available methods (called via @data directives):
 *   controllers.list("Name|File|Description")       — inherited
 *   controllers.deps("Controller|Models")            — inherited
 *   controllers.csv("Name|CSV Import|CSV Export|Excel Export")
 *   controllers.actions("Action|Logic|Output Type")
 */

import fs from "fs";
import path from "path";
import ControllersSource from "../../webapp/data/controllers.js";
import {
  stripBlockComments,
  extractArrayBody,
  extractQuotedStrings,
} from "../../../docs/lib/php-array-parser.js";

const LIFECYCLE_METHODS = new Set([
  "beforeFilter",
  "afterFilter",
  "beforeRender",
  "beforeRedirect",
  "constructClasses",
  "initialize",
  "startup",
  "shutdownProcess",
]);

export default class CakephpControllersSource extends ControllersSource {
  scan(sourceRoot, scanCfg) {
    const cfg = scanCfg.controllers;
    if (!cfg) return { controllers: [], summary: {} };

    const controllerDir = path.join(sourceRoot, cfg.dir);
    if (!fs.existsSync(controllerDir)) return { controllers: [], summary: {} };

    const files = fs
      .readdirSync(controllerDir)
      .filter((f) => f.endsWith("Controller.php") && f !== "AppController.php");

    const controllers = [];
    for (const file of files) {
      const filePath = path.join(controllerDir, file);
      const raw = fs.readFileSync(filePath, "utf8");
      const src = stripBlockComments(raw);

      const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
      if (!classMatch) continue;

      const className = classMatch[1];
      const parentClass = classMatch[2];

      const componentsBody = extractArrayBody(src, "components");
      const components = componentsBody
        ? extractQuotedStrings(componentsBody)
        : [];

      const usesBody = extractArrayBody(src, "uses");
      const uses = usesBody ? extractQuotedStrings(usesBody) : [];

      const actions = [];
      const fnRe = /public\s+function\s+(\w+)\s*\(/g;
      let fm;
      while ((fm = fnRe.exec(src)) !== null) {
        const name = fm[1];
        if (!LIFECYCLE_METHODS.has(name) && !name.startsWith("_")) {
          actions.push(name);
        }
      }

      controllers.push({
        file: path.join(cfg.dir, file),
        className,
        parentClass,
        components,
        uses,
        actions,
      });
    }

    controllers.sort((a, b) => a.className.localeCompare(b.className));

    return {
      controllers,
      summary: {
        total: controllers.length,
        totalActions: controllers.reduce((s, c) => s + c.actions.length, 0),
      },
    };
  }

  /** CSV import/export capabilities table (from overrides.json). */
  csv(analysis, labels) {
    const csvMap = this.overrides().controllersCsv || {};
    const entries = Object.entries(csvMap).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return null;
    const rows = entries.map(([name, ops]) => [
      name,
      ops.csvImport ? "○" : "—",
      ops.csvExport ? "○" : "—",
      ops.excelExport ? "○" : "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Controller actions → Logic class mapping table. */
  actions(analysis, labels) {
    if (!analysis.extras?.titlesGraphMapping) return null;
    const items = analysis.extras.titlesGraphMapping.filter((m) => m.logicClasses.length > 0);
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.action,
      m.logicClasses.join(", "),
      m.outputType,
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

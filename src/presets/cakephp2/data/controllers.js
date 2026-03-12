/**
 * ControllersSource — CakePHP 2.x controllers DataSource.
 *
 * Extends webapp ControllersSource with CakePHP-specific scan logic
 * and resolve methods (csv, actions).
 */

import fs from "fs";
import ControllersSource from "../../webapp/data/controllers.js";
import { getFileStats } from "../../../docs/lib/scanner.js";
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
  match(file) {
    return /Controller\.php$/.test(file.relPath)
      && file.relPath.includes("Controller/")
      && !/AppController\.php$/.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return { controllers: [], summary: {} };

    const controllers = [];
    for (const f of files) {
      const raw = fs.readFileSync(f.absPath, "utf8");
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
        file: f.relPath,
        className,
        parentClass,
        components,
        uses,
        actions,
        lines: f.lines,
        hash: f.hash,
        mtime: f.mtime,
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

  /** CSV import/export capabilities table. */
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
    if (!analysis.config?.titlesGraphMapping) return null;
    const items = analysis.config.titlesGraphMapping.filter((m) => m.logicClasses.length > 0);
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.action,
      m.logicClasses.join(", "),
      m.outputType,
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

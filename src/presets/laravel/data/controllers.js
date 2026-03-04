/**
 * ControllersSource — Laravel controllers DataSource.
 *
 * Combines scan (source code extraction) and resolve (Markdown rendering)
 * into a single self-contained class.
 *
 * Available methods (called via @data directives):
 *   controllers.list("Name|File|Description")
 *   controllers.actions("Controller|Action")
 *   controllers.middleware("Middleware|Controllers")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { analyzeControllers } from "../scan/controllers.js";

class ControllersSource extends DataSource {
  scan(sourceRoot) {
    return analyzeControllers(sourceRoot);
  }

  /** Controller list table. */
  list(analysis, labels) {
    const ctrls =
      analysis.extras?.laravelControllers ||
      analysis.controllers?.controllers ||
      [];
    if (ctrls.length === 0) return null;
    const rows = this.toRows(ctrls, (c) => [
      c.className,
      c.file,
      this.desc("controllers", c.className),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Controller actions table. */
  actions(analysis, labels) {
    const ctrls = analysis.extras?.laravelControllers || [];
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
    const ctrls = analysis.extras?.laravelControllers || [];
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

export default new ControllersSource();

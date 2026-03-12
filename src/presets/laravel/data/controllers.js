/**
 * ControllersSource — Laravel controllers DataSource.
 *
 * Extends the webapp parent ControllersSource with Laravel-specific
 * scan logic and resolve methods.
 *
 * Available methods (called via {{data}} directives):
 *   controllers.list("Name|File|Description")
 *   controllers.actions("Controller|Action")
 *   controllers.middleware("Middleware|Controllers")
 */

import ControllersSource from "../../webapp/data/controllers.js";
import { analyzeControllers } from "../scan/controllers.js";

function deriveSourceRoot(files) {
  const f = files[0];
  return f.absPath.slice(0, f.absPath.length - f.relPath.length).replace(/\/$/, "");
}

export default class LaravelControllersSource extends ControllersSource {
  match(file) {
    return (
      file.relPath.startsWith("app/Http/Controllers/") &&
      file.relPath.endsWith(".php") &&
      file.fileName !== "Controller.php"
    );
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = deriveSourceRoot(files);
    const result = analyzeControllers(sourceRoot);
    return { laravelControllers: result.controllers };
  }

  /** Controller list table. */
  list(analysis, labels) {
    const ctrls =
      analysis.controllers?.laravelControllers ||
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
    const ctrls = analysis.controllers?.laravelControllers || [];
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
    const ctrls = analysis.controllers?.laravelControllers || [];
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

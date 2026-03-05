/**
 * ControllersSource — Symfony controllers DataSource.
 *
 * Extends the webapp parent ControllersSource with Symfony-specific
 * scan logic and resolve methods.
 *
 * Available methods (called via {{data}} directives):
 *   controllers.list("Name|File|Description")
 *   controllers.actions("Controller|Action")
 *   controllers.di("Controller|Dependency")
 */

import ControllersSource from "../../webapp/data/controllers.js";
import { analyzeControllers } from "../scan/controllers.js";

export default class SymfonyControllersSource extends ControllersSource {
  scan(sourceRoot, scanCfg) {
    const result = analyzeControllers(sourceRoot);
    return { symfonyControllers: result.controllers };
  }

  /** Controller list table. */
  list(analysis, labels) {
    const ctrls =
      analysis.extras?.symfonyControllers ||
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
    const ctrls = analysis.extras?.symfonyControllers || [];
    if (ctrls.length === 0) return null;
    const rows = [];
    for (const c of ctrls) {
      for (const action of c.actions || []) {
        rows.push([c.className, action.name]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Controller DI dependencies table. */
  di(analysis, labels) {
    const ctrls = analysis.extras?.symfonyControllers || [];
    if (ctrls.length === 0) return null;
    const rows = [];
    for (const c of ctrls) {
      for (const dep of c.diDeps || []) {
        rows.push([c.className, dep]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }
}

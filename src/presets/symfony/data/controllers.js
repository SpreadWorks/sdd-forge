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
  match(file) {
    return /\.php$/.test(file.fileName) && file.relPath.startsWith("src/Controller/");
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = this.deriveSourceRoot(files);
    const result = analyzeControllers(sourceRoot);
    return { symfonyControllers: result.controllers };
  }

  /** Controller list table. */
  list(analysis, labels) {
    const ctrls = this.mergeDesc(
      analysis.controllers?.symfonyControllers ||
      analysis.controllers?.controllers ||
      [],
      "controllers",
    );
    if (ctrls.length === 0) return null;
    const rows = this.toRows(ctrls, (c) => [
      c.className,
      c.file,
      c.summary || "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Controller actions table. */
  actions(analysis, labels) {
    const ctrls = analysis.controllers?.symfonyControllers || [];
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
    const ctrls = analysis.controllers?.symfonyControllers || [];
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

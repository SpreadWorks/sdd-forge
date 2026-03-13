/**
 * ControllersSource — webapp common controllers scan + resolve.
 *
 * Child presets (cakephp2, laravel, symfony) extend this class
 * to add FW-specific scan logic and resolve methods.
 */

import WebappDataSource from "./webapp-data-source.js";
import { parseFile } from "../../../docs/lib/scanner.js";

export default class ControllersSource extends WebappDataSource {
  match(file) {
    return false;
  }

  scan(files) {
    if (files.length === 0) return null;

    const controllers = [];
    for (const f of files) {
      const parsed = parseFile(f.absPath);
      controllers.push({
        file: f.relPath,
        className: parsed.className,
        parentClass: parsed.parentClass,
        components: parsed.properties.components || [],
        uses: parsed.properties.uses || [],
        actions: parsed.methods.filter((m) => !m.startsWith("_")),
        lines: f.lines,
        hash: f.hash,
        mtime: f.mtime,
      });
    }

    const totalActions = controllers.reduce((s, c) => s + c.actions.length, 0);
    return {
      controllers,
      summary: { total: controllers.length, totalActions },
    };
  }

  summarize(data) {
    return {
      ...data.summary,
      top: data.controllers.slice(0, 10).map((x) => ({
        className: x.className,
        actions: x.actions.slice(0, 8),
      })),
    };
  }

  /** Controller list table. */
  list(analysis, labels) {
    const items = analysis.controllers?.controllers || [];
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.className,
      c.file,
      this.desc("controllers", c.className, c.summary),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Controller → Model dependency table. */
  deps(analysis, labels) {
    const items = (analysis.controllers?.controllers || []).filter((c) => c.uses.length > 0);
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.className,
      c.uses.join(", "),
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

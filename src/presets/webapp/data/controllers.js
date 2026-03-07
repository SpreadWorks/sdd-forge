/**
 * ControllersSource — webapp common controllers scan + resolve.
 *
 * Child presets (cakephp2, laravel, symfony) extend this class
 * to add FW-specific scan logic and resolve methods.
 */

import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { findFiles, parseFile } from "../../../docs/lib/scanner.js";

export default class ControllersSource extends Scannable(DataSource) {
  scan(sourceRoot, scanCfg) {
    const cfg = scanCfg.controllers;
    if (!cfg) return null;

    const dir = path.join(sourceRoot, cfg.dir);
    const files = findFiles(dir, cfg.pattern, cfg.exclude, cfg.subDirs);

    const controllers = [];
    for (const f of files) {
      const parsed = parseFile(f.absPath, cfg.lang);
      controllers.push({
        file: path.join(cfg.dir, f.relPath),
        className: parsed.className,
        parentClass: parsed.parentClass,
        components: parsed.properties.components || [],
        uses: parsed.properties.uses || [],
        actions: parsed.methods.filter((m) => !m.startsWith("_")),
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
      this.desc("controllers", c.className),
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

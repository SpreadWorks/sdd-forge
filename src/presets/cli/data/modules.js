/**
 * ModulesSource — CLI common modules scan + resolve.
 *
 * Generic category analyzer for CLI presets (e.g. node-cli).
 * Scans source files and extracts classes/functions.
 */

import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { findFiles, parseFile } from "../../../docs/lib/scanner.js";

export default class ModulesSource extends Scannable(DataSource) {
  scan(sourceRoot, scanCfg) {
    const cfg = scanCfg.modules;
    if (!cfg) return null;

    const dir = path.join(sourceRoot, cfg.dir);
    const files = findFiles(dir, cfg.pattern, cfg.exclude, cfg.subDirs);

    const items = [];
    for (const f of files) {
      const parsed = parseFile(f.absPath, cfg.lang);
      items.push({
        file: path.join(cfg.dir, f.relPath),
        className: parsed.className,
        methods: parsed.methods,
      });
    }

    const totalMethods = items.reduce((s, i) => s + i.methods.length, 0);
    return {
      modules: items,
      summary: { total: items.length, totalMethods },
    };
  }

  /** Module list table. */
  list(analysis, labels) {
    const items = analysis.modules?.modules || [];
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.className,
      m.file,
      this.desc("modules", m.className),
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

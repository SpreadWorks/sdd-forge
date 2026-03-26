/**
 * ModulesSource — CLI common modules scan + resolve.
 *
 * Generic category analyzer for CLI presets (e.g. node-cli).
 * Scans source files and extracts classes/functions.
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { parseFile } from "../../../docs/lib/scanner.js";

export class ModuleEntry extends AnalysisEntry {
  className = null;
  methods = null;

  static summary = {
    totalMethods: { field: "methods", aggregate: "count" },
  };
}

export default class ModulesSource extends Scannable(DataSource) {
  static Entry = ModuleEntry;

  match(relPath) {
    return /\.(js|mjs|cjs)$/.test(relPath);
  }

  parse(absPath) {
    const entry = new ModuleEntry();
    const parsed = parseFile(absPath);
    entry.className = parsed.className;
    entry.methods = parsed.methods;
    return entry;
  }

  /** Module list table. */
  list(analysis, labels) {
    const items = this.mergeDesc(analysis.modules?.entries || [], "modules");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.className,
      m.file,
      m.summary || "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

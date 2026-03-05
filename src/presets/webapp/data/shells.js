/**
 * ShellsSource — webapp common shells/commands scan + resolve.
 *
 * Child presets extend this class to add FW-specific scan logic
 * and resolve methods.
 */

import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { findFiles, parseFile } from "../../../docs/lib/scanner.js";

export default class ShellsSource extends Scannable(DataSource) {
  scan(sourceRoot, scanCfg) {
    const cfg = scanCfg.shells;
    if (!cfg) return null;

    const dir = path.join(sourceRoot, cfg.dir);
    const files = findFiles(dir, cfg.pattern, cfg.exclude, cfg.subDirs);

    const shells = [];
    for (const f of files) {
      const parsed = parseFile(f.absPath, cfg.lang);
      const hasMain = parsed.methods.includes("main");
      shells.push({
        file: path.join(cfg.dir, f.relPath),
        className: parsed.className,
        publicMethods: parsed.methods.filter((m) => !m.startsWith("_")),
        hasMain,
        appUses: [],
      });
    }

    return {
      shells,
      summary: {
        total: shells.length,
        withMain: shells.filter((s) => s.hasMain).length,
      },
    };
  }

  /** Shell/command list. */
  list(analysis, labels) {
    const items = analysis.shells?.shells || [];
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => [
      s.className,
      s.file,
      this.desc("shells", s.className),
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

/**
 * ShellsSource — webapp common shells/commands scan + resolve.
 *
 * Child presets extend this class to add FW-specific scan logic
 * and resolve methods.
 */

import WebappDataSource from "./webapp-data-source.js";
import { parseFile } from "../../../docs/lib/scanner.js";

export default class ShellsSource extends WebappDataSource {
  match(file) {
    return false;
  }

  scan(files) {
    if (files.length === 0) return null;

    const shells = [];
    for (const f of files) {
      const parsed = parseFile(f.absPath);
      const hasMain = parsed.methods.includes("main");
      shells.push({
        file: f.relPath,
        className: parsed.className,
        publicMethods: parsed.methods.filter((m) => !m.startsWith("_")),
        hasMain,
        appUses: [],
        lines: f.lines,
        hash: f.hash,
        mtime: f.mtime,
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

  summarize(data) {
    return {
      ...data.summary,
      items: data.shells.map((x) => ({
        className: x.className,
        methods: x.publicMethods,
      })),
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

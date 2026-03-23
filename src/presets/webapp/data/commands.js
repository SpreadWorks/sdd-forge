/**
 * CommandsSource — webapp common commands scan + resolve.
 *
 * Child presets extend this class to add FW-specific scan logic
 * and resolve methods.
 */

import WebappDataSource from "./webapp-data-source.js";
import { parseFile } from "../../../docs/lib/scanner.js";

export default class CommandsSource extends WebappDataSource {
  match(file) {
    return false;
  }

  scan(files) {
    if (files.length === 0) return null;

    const commands = [];
    for (const f of files) {
      const parsed = parseFile(f.absPath);
      commands.push({
        file: f.relPath,
        className: parsed.className,
        publicMethods: parsed.methods.filter((m) => !m.startsWith("_")),
        appUses: [],
        lines: f.lines,
        hash: f.hash,
        mtime: f.mtime,
      });
    }

    return {
      commands,
      summary: {
        total: commands.length,
      },
    };
  }

  summarize(data) {
    return {
      ...data.summary,
      items: data.commands.map((x) => ({
        className: x.className,
        methods: x.publicMethods,
      })),
    };
  }

  /** Command list. */
  list(analysis, labels) {
    const items = this.mergeDesc(analysis.commands?.commands || [], "commands");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => [
      s.className,
      s.file,
      s.summary || "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

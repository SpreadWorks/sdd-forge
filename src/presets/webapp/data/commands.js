/**
 * CommandsSource — webapp common commands scan + resolve.
 *
 * Child presets extend this class to add FW-specific scan logic
 * and resolve methods.
 */

import WebappDataSource from "./webapp-data-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { parseFile } from "../../../docs/lib/scanner.js";

export class CommandEntry extends AnalysisEntry {
  className = null;
  publicMethods = null;
  appUses = null;

  static summary = {};
}

export default class CommandsSource extends WebappDataSource {
  static Entry = CommandEntry;

  match(relPath) {
    return false;
  }

  parse(absPath) {
    const entry = new CommandEntry();
    const parsed = parseFile(absPath);
    entry.className = parsed.className;
    entry.publicMethods = parsed.methods.filter((m) => !m.startsWith("_"));
    entry.appUses = [];
    return entry;
  }

  /** Command list. */
  list(analysis, labels) {
    const items = this.mergeDesc(analysis.commands?.entries || [], "commands");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => [
      s.className,
      s.file,
      s.summary || "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

/**
 * CommandsSource — Symfony console commands DataSource.
 *
 * Uses shells from generic scan (no specific scan function).
 *
 * Available methods (called via @data directives):
 *   commands.list("Name|File|Description")
 */

import { DataSource } from "../../../docs/lib/data-source.js";

class CommandsSource extends DataSource {
  scan() {
    // Commands use the generic shell scan; no dedicated scanner.
    return {};
  }

  /** Console commands list table. */
  list(analysis, labels) {
    const shells = analysis.shells?.shells || [];
    if (shells.length === 0) return null;
    const rows = this.toRows(shells, (s) => [
      s.className,
      s.file,
      this.desc("commands", s.className),
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

export default new CommandsSource();

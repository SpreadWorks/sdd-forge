/**
 * CommandsSource — Laravel Artisan commands DataSource.
 *
 * Uses shells data from the generic scan (no preset-specific scan).
 *
 * Available methods (called via @data directives):
 *   commands.list("Name|File|Description")
 */

import { DataSource } from "../../../docs/lib/data-source.js";

class CommandsSource extends DataSource {
  scan() {
    // No preset-specific scan; relies on shells from genericScan.
    return {};
  }

  /** Artisan commands list table. */
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

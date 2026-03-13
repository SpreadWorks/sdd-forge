/**
 * CommandsSource — Symfony console commands DataSource.
 *
 * Symfony-only category using DataSource directly (no scan).
 *
 * Available methods (called via {{data}} directives):
 *   commands.list("Name|File|Description")
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class CommandsSource extends DataSource {
  /** Console commands list table. */
  list(analysis, labels) {
    const shells = analysis.shells?.shells || [];
    if (shells.length === 0) return null;
    const rows = this.toRows(shells, (s) => [
      s.className,
      s.file,
      this.desc("commands", s.className, s.summary),
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

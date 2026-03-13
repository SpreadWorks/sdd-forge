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
    const shells = this.mergeDesc(analysis.shells?.shells || [], "commands");
    if (shells.length === 0) return null;
    const rows = this.toRows(shells, (s) => [
      s.className,
      s.file,
      s.summary || "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

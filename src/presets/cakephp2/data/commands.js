/**
 * CommandsSource — CakePHP 2.x commands DataSource.
 *
 * Extends webapp CommandsSource with CakePHP-specific resolve methods.
 * Scan is delegated to the parent class.
 *
 * Available methods (called via {{data}} directives):
 *   commands.list("Class|File|Description")            — inherited
 *   commands.deps("Command|Dependency|Type")
 *   commands.flow("Class|Flow|Mail|File Ops|Transaction")
 */

import CommandsSource from "../../webapp/data/commands.js";

export default class CakephpCommandsSource extends CommandsSource {
  match(file) {
    return /Shell\.php$/.test(file.relPath)
      && file.relPath.includes("Console/Command/")
      && !/AppShell\.php$/.test(file.relPath);
  }

  /** Command → dependency table (App::uses). */
  deps(analysis, labels) {
    const rows = [];
    for (const s of analysis.commands.commands) {
      for (const dep of s.appUses || []) {
        rows.push([s.className, dep.class, dep.package]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Command execution flow detail. */
  flow(analysis, labels) {
    if (!analysis.config?.commandDetails) return null;
    const items = analysis.config.commandDetails;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => [
      s.className,
      s.flowSteps.join(" → "),
      s.hasMail ? "あり" : "なし",
      s.hasFileOps ? "あり" : "なし",
      s.hasTransaction ? "あり" : "なし",
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

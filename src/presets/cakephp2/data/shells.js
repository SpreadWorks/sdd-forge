/**
 * ShellsSource — CakePHP 2.x shells DataSource.
 *
 * Extends webapp ShellsSource with CakePHP-specific resolve methods.
 * Scan is delegated to the parent class.
 *
 * Available methods (called via {{data}} directives):
 *   shells.list("Class|File|Description")            — inherited
 *   shells.deps("Shell|Dependency|Type")
 *   shells.flow("Class|Flow|Mail|File Ops|Transaction")
 */

import ShellsSource from "../../webapp/data/shells.js";

export default class CakephpShellsSource extends ShellsSource {
  /** Shell → dependency table (App::uses). */
  deps(analysis, labels) {
    const rows = [];
    for (const s of analysis.shells.shells) {
      for (const dep of s.appUses || []) {
        rows.push([s.className, dep.class, dep.package]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Shell execution flow detail. */
  flow(analysis, labels) {
    if (!analysis.extras?.shellDetails) return null;
    const items = analysis.extras.shellDetails;
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

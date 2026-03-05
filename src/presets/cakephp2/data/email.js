/**
 * EmailSource — CakePHP 2.x email notifications DataSource.
 *
 * CakePHP-only category: extends Scannable(DataSource) directly.
 *
 * Available methods (called via {{data}} directives):
 *   email.list("File|Subjects|CC/Transport")
 */

import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { analyzeEmailNotifications } from "../scan/notifications.js";

export default class CakephpEmailSource extends Scannable(DataSource) {
  scan(sourceRoot, scanCfg) {
    const appDir = path.join(sourceRoot, "app");
    return { emailNotifications: analyzeEmailNotifications(appDir) };
  }

  /** Email notification usage list. */
  list(analysis, labels) {
    if (!analysis.extras?.emailNotifications) return null;
    const email = analysis.extras.emailNotifications;
    if (!email.usages || email.usages.length === 0) return null;

    const from = email.config?.defaultFrom || "—";
    const transport = email.config?.transport || "—";
    const rows = [[`（デフォルト送信元: ${from}）`, "", ""]];
    for (const usage of email.usages) {
      const fileName = usage.file.split("/").pop();
      const subjects = usage.subjects.length > 0 ? usage.subjects.join("; ") : "（動的生成）";
      rows.push([fileName, subjects, transport]);
    }
    return this.toMarkdownTable(rows, labels);
  }
}

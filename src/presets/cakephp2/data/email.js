/**
 * EmailSource — CakePHP 2.x email notifications DataSource.
 *
 * Available methods (called via @data directives):
 *   email.list("File|Subjects|CC/Transport")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { analyzeEmailNotifications } from "../scan/notifications.js";

class EmailSource extends DataSource {
  scan(sourceRoot) {
    return analyzeEmailNotifications(sourceRoot);
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

export default new EmailSource();

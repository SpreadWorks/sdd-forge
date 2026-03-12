/**
 * EmailSource — CakePHP 2.x email notifications DataSource.
 */

import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { analyzeEmailNotifications } from "../scan/notifications.js";

export default class CakephpEmailSource extends WebappDataSource {
  match(file) {
    return /^app\/View\/Emails\//.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = this.deriveSourceRoot(files);
    const appDir = sourceRoot + "/app";
    return { emailNotifications: analyzeEmailNotifications(appDir) };
  }

  list(analysis, labels) {
    if (!analysis.email?.emailNotifications) return null;
    const email = analysis.email.emailNotifications;
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

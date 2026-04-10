/**
 * EmailSource — CakePHP 2.x email notifications DataSource.
 *
 * Matches email template files (app/View/Emails/) and PHP source files
 * that use CakeEmail (app/Console/Command/, app/Lib/).
 * Also matches app/Config/email.php for email transport config.
 */

import fs from "fs";
import path from "path";
import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { stripBlockComments } from "../../../docs/lib/php-array-parser.js";
import { hasPathPrefix, hasSegmentPath } from "../../lib/path-match.js";

export class EmailEntry extends AnalysisEntry {
  /** "template" | "config" | "usage" */
  emailType = null;
  /** For config type */
  transport = null;
  defaultFrom = null;
  /** For usage type: subjects found via ->subject() calls */
  subjects = null;
  hasCc = null;

  static summary = {};
}

export default class CakephpEmailSource extends WebappDataSource {
  static Entry = EmailEntry;

  match(relPath) {
    return hasPathPrefix(relPath, "app/View/Emails/")
      || hasSegmentPath(relPath, "app/Config/email.php")
      || (hasPathPrefix(relPath, "app/Console/Command/") && /\w+\.php$/.test(relPath))
      || (hasPathPrefix(relPath, "app/Lib/") && /\w+\.php$/.test(relPath));
  }

  parse(absPath) {
    const entry = new EmailEntry();
    const content = fs.readFileSync(absPath, "utf8");

    if (absPath.endsWith("/Config/email.php")) {
      entry.emailType = "config";
      const src = stripBlockComments(content);
      const defaultMatch = src.match(/\$default\s*=\s*array\s*\(([\s\S]*?)\)\s*;/);
      if (defaultMatch) {
        const body = defaultMatch[1];
        const transport = body.match(/['"]transport['"]\s*=>\s*['"](\w+)['"]/);
        const from = body.match(/['"]from['"]\s*=>\s*['"]([^'"]+)['"]/);
        if (transport) entry.transport = transport[1];
        if (from) entry.defaultFrom = from[1];
      }
      return entry;
    }

    if (/\/View\/Emails\//.test(absPath)) {
      entry.emailType = "template";
      return entry;
    }

    // Console/Command or Lib PHP files — only include if they use CakeEmail
    if (!content.includes("CakeEmail")) return entry;

    entry.emailType = "usage";
    const subjects = [];
    const subjectStartRe = /->subject\s*\(/g;
    let sm;
    while ((sm = subjectStartRe.exec(content)) !== null) {
      const startIdx = sm.index + sm[0].length;
      let depth = 1;
      let i = startIdx;
      while (i < content.length && depth > 0) {
        if (content[i] === "(") depth++;
        else if (content[i] === ")") depth--;
        i++;
      }
      let subj = content.slice(startIdx, i - 1).trim();
      subj = subj
        .replace(/Configure::read\(['"]([^'"]+)['"]\)/g, "{$1}")
        .replace(/\s*\.\s*/g, "")
        .replace(/["']/g, "");
      subjects.push(subj);
    }
    entry.subjects = [...new Set(subjects)];
    entry.hasCc = /->cc\s*\(/.test(content);

    return entry;
  }

  list(analysis, labels) {
    const entries = analysis.email?.entries || [];
    const usages = entries.filter((e) => e.emailType === "usage");
    if (usages.length === 0) return null;

    const configEntries = entries.filter((e) => e.emailType === "config");
    const from = configEntries[0]?.defaultFrom || "—";
    const transport = configEntries[0]?.transport || "—";

    const rows = [[`（デフォルト送信元: ${from}）`, "", ""]];
    for (const usage of usages) {
      const fileName = usage.file?.split("/").pop() || "—";
      const subjects = usage.subjects?.length > 0 ? usage.subjects.join("; ") : "（動的生成）";
      rows.push([fileName, subjects, transport]);
    }
    return this.toMarkdownTable(rows, labels);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzers moved from scan/notifications.js
// ---------------------------------------------------------------------------

export function analyzeEmailNotifications(appDir) {
  const result = { config: {}, usages: [] };

  // email.php 設定
  const emailConfigPath = path.join(appDir, "Config", "email.php");
  if (fs.existsSync(emailConfigPath)) {
    const raw = fs.readFileSync(emailConfigPath, "utf8");
    const src = stripBlockComments(raw);
    const defaultMatch = src.match(/\$default\s*=\s*array\s*\(([\s\S]*?)\)\s*;/);
    if (defaultMatch) {
      const body = defaultMatch[1];
      const transport = body.match(/['"]transport['"]\s*=>\s*['"](\w+)['"]/);
      const from = body.match(/['"]from['"]\s*=>\s*['"]([^'"]+)['"]/);
      if (transport) result.config.transport = transport[1];
      if (from) result.config.defaultFrom = from[1];
    }
  }

  // CakeEmail 使用箇所
  const searchDirs = [
    { dir: "Console/Command", prefix: "Console/Command" },
    { dir: "Lib", prefix: "Lib" },
  ];
  for (const { dir, prefix } of searchDirs) {
    const dirPath = path.join(appDir, dir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".php"));
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const raw = fs.readFileSync(filePath, "utf8");
      if (!raw.includes("CakeEmail")) continue;

      const subjects = [];
      const subjectStartRe = /->subject\s*\(/g;
      let sm;
      while ((sm = subjectStartRe.exec(raw)) !== null) {
        // balanced-paren で引数全体を取得
        const startIdx = sm.index + sm[0].length;
        let depth = 1;
        let i = startIdx;
        while (i < raw.length && depth > 0) {
          if (raw[i] === "(") depth++;
          else if (raw[i] === ")") depth--;
          i++;
        }
        let subj = raw.slice(startIdx, i - 1).trim();
        subj = subj
          .replace(/Configure::read\(['"]([^'"]+)['"]\)/g, "{$1}")
          .replace(/\s*\.\s*/g, "")
          .replace(/["']/g, "");
        subjects.push(subj);
      }

      const hasCc = /->cc\s*\(/.test(raw);

      result.usages.push({
        file: "app/" + prefix + "/" + file,
        subjects: [...new Set(subjects)],
        hasCc,
      });
    }
  }

  return result;
}

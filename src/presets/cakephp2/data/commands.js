/**
 * CommandsSource — CakePHP 2.x commands DataSource.
 *
 * Extends webapp CommandsSource with CakePHP-specific parse logic
 * and resolve methods (deps, flow).
 */

import fs from "fs";
import path from "path";
import CommandsSource from "../../webapp/data/commands.js";
import { CommandEntry } from "../../webapp/data/commands.js";
import { stripBlockComments } from "../../../docs/lib/php-array-parser.js";

export default class CakephpCommandsSource extends CommandsSource {
  static Entry = CommandEntry;

  match(relPath) {
    return /Shell\.php$/.test(relPath)
      && relPath.includes("Console/Command/")
      && !/AppShell\.php$/.test(relPath);
  }

  parse(absPath) {
    const entry = new CommandEntry();
    const raw = fs.readFileSync(absPath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
    if (!classMatch) return entry;

    entry.className = classMatch[1];

    const methods = [];
    const fnRe = /public\s+function\s+(\w+)\s*\(/g;
    let fm;
    while ((fm = fnRe.exec(src)) !== null) {
      if (!fm[1].startsWith("_")) methods.push(fm[1]);
    }
    entry.publicMethods = methods;

    // App::uses dependencies
    const appUses = [];
    const usesRe = /App::uses\s*\(\s*['"](\w+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;
    let um;
    while ((um = usesRe.exec(raw)) !== null) {
      appUses.push({ class: um[1], package: um[2] });
    }
    entry.appUses = appUses;

    return entry;
  }

  /** Command → dependency table (App::uses). */
  deps(analysis, labels) {
    const rows = [];
    for (const s of analysis.commands?.entries || []) {
      for (const dep of s.appUses || []) {
        rows.push([s.className, dep.class, dep.package]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Command execution flow detail. */
  flow(analysis, labels) {
    const configEntries = analysis.config?.entries;
    if (!configEntries) return null;
    const items = configEntries.flatMap((e) => e.commandDetails || []);
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

// ---------------------------------------------------------------------------
// Directory-level analyzers moved from scan/commands-detail.js
// ---------------------------------------------------------------------------

export function analyzeCommandDetails(appDir) {
  const commandDir = path.join(appDir, "Console", "Command");
  if (!fs.existsSync(commandDir)) return [];

  // CakePHP 2.x convention: console commands use *Shell.php filenames
  const files = fs.readdirSync(commandDir).filter((f) => f.endsWith("Shell.php"));
  const results = [];

  for (const file of files) {
    const filePath = path.join(commandDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
    if (!classMatch) continue;
    if (classMatch[1] === "AppShell") continue;

    const hasMail = /CakeEmail/.test(raw);
    const hasFileOps = /rename\s*\(|file_get_contents|fopen|unlink|file_put_contents/.test(raw);
    const hasTransaction = /begin\s*\(\)|rollback\s*\(\)|commit\s*\(/.test(raw);

    const flowSteps = [];
    if (/getTarget|find\s*\(/.test(src)) flowSteps.push("対象データ取得");
    if (/readdir|scandir|glob\(|file_get_contents/.test(src)) flowSteps.push("ファイル読込");
    if (/import/i.test(src)) flowSteps.push("データインポート");
    if (hasTransaction) flowSteps.push("トランザクション管理");
    if (/createViewReports/.test(src)) flowSteps.push("レポート生成");
    if (hasMail) flowSteps.push("メール通知");
    if (/rename\s*\(/.test(src)) flowSteps.push("ファイルバックアップ");
    if (/unlink\s*\(/.test(src)) flowSteps.push("ファイル削除");

    results.push({
      className: classMatch[1],
      file: "app/Console/Command/" + file,
      hasMail,
      hasFileOps,
      hasTransaction,
      flowSteps,
    });
  }

  results.sort((a, b) => a.className.localeCompare(b.className));
  return results;
}

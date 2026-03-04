/**
 * analyze-shells-detail.js
 *
 * Detailed Shell execution flow analyzer.
 */

import fs from "fs";
import path from "path";
import { stripBlockComments } from "../../../lib/php-array-parser.js";

// ---------------------------------------------------------------------------
// Shell 実行フロー詳細解析
// ---------------------------------------------------------------------------
export function analyzeShellDetails(appDir) {
  const shellDir = path.join(appDir, "Console", "Command");
  if (!fs.existsSync(shellDir)) return [];

  const files = fs.readdirSync(shellDir).filter((f) => f.endsWith("Shell.php"));
  const results = [];

  for (const file of files) {
    const filePath = path.join(shellDir, file);
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

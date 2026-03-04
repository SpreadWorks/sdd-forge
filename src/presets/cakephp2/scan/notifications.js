/**
 * analyze-notifications.js
 *
 * Email notification analyzer.
 */

import fs from "fs";
import path from "path";
import { stripBlockComments } from "../../../docs/lib/php-array-parser.js";

// ---------------------------------------------------------------------------
// メール通知仕様解析
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

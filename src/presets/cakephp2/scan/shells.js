#!/usr/bin/env node
/**
 * tools/analyzers/analyze-shells.js
 *
 * app/Console/Command/*Shell.php を走査し、
 * クラス名・公開メソッド・main 有無・App::uses を抽出する。
 */

import fs from "fs";
import path from "path";
import { stripBlockComments } from "../../docs/lib/php-array-parser.js";

const LIFECYCLE_METHODS = new Set([
  "startup",
  "initialize",
  "getOptionParser",
]);

export function analyzeShells(appDir) {
  const shellDir = path.join(appDir, "Console", "Command");
  if (!fs.existsSync(shellDir)) return { shells: [], summary: {} };

  const files = fs
    .readdirSync(shellDir)
    .filter((f) => f.endsWith("Shell.php") && f !== "AppShell.php");

  const shells = [];
  for (const file of files) {
    const filePath = path.join(shellDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
    if (!classMatch) continue;

    const className = classMatch[1];

    const publicMethods = [];
    const fnRe = /public\s+function\s+(\w+)\s*\(/g;
    let fm;
    while ((fm = fnRe.exec(src)) !== null) {
      const name = fm[1];
      if (!LIFECYCLE_METHODS.has(name) && !name.startsWith("_")) {
        publicMethods.push(name);
      }
    }

    const hasMain = publicMethods.includes("main");

    const appUses = [];
    const usesRe = /App::uses\s*\(\s*['"](\w+)['"]\s*,\s*['"]([\w/]+)['"]\s*\)/g;
    let um;
    while ((um = usesRe.exec(raw)) !== null) {
      appUses.push({ class: um[1], package: um[2] });
    }

    shells.push({
      file: path.relative(path.resolve(appDir, ".."), filePath),
      className,
      publicMethods,
      hasMain,
      appUses,
    });
  }

  shells.sort((a, b) => a.className.localeCompare(b.className));

  return {
    shells,
    summary: {
      total: shells.length,
      withMain: shells.filter((s) => s.hasMain).length,
    },
  };
}

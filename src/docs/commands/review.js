#!/usr/bin/env node
/**
 * src/docs/commands/review.js
 *
 * docs 品質チェック。
 * 章ファイル（NN_*.md）の基本構造を検証する。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot, parseArgs } from "../../lib/cli.js";

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args, { flags: [], options: [] });

  if (opts.help) {
    console.log("Usage: sdd-forge review [<docs-dir>]");
    console.log("");
    console.log("  docs/ 配下の章ファイル（NN_*.md）を検証する。");
    console.log("  引数なしの場合は ${SDD_WORK_ROOT}/docs を対象とする。");
    process.exit(0);
  }

  const workRoot = repoRoot();
  const targetDir = args.find((a) => !a.startsWith("-")) || path.join(workRoot, "docs");

  // Discover chapter files (NN_*.md)
  let chapterFiles = [];
  if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
    chapterFiles = fs
      .readdirSync(targetDir)
      .filter((f) => /^[0-9]{2}_.*\.md$/.test(f))
      .sort();
  }

  if (chapterFiles.length === 0) {
    console.log(`[FAIL] no chapter files found in ${targetDir}`);
    process.exit(1);
  }

  console.log(`Found ${chapterFiles.length} chapter file(s)`);

  const MIN_LINES = 15;
  let fail = 0;

  for (const f of chapterFiles) {
    const filePath = path.join(targetDir, f);

    if (!fs.existsSync(filePath)) {
      console.log(`[FAIL] missing file: ${filePath}`);
      fail = 1;
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    // Line count check
    if (lines.length < MIN_LINES) {
      console.log(`[FAIL] too short (${lines.length} lines): ${f}`);
      fail = 1;
    }

    // H1 heading check
    if (!lines.some((line) => /^# /.test(line))) {
      console.log(`[FAIL] missing H1 heading: ${f}`);
      fail = 1;
    }

    // Unfilled @text directive check
    let unfilled = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*<!-- @text/.test(lines[i])) {
        const nextLine = (lines[i + 1] || "").trim();
        if (nextLine === "") {
          unfilled++;
        }
      }
    }
    if (unfilled > 0) {
      console.log(`[WARN] ${unfilled} unfilled @text directive(s): ${f}`);
    }
  }

  // README.md check (warn only)
  if (!fs.existsSync(path.join(workRoot, "README.md"))) {
    console.log("[WARN] README.md not found. Run 'sdd-forge readme' to generate.");
  }

  if (fail !== 0) {
    console.log("docs quality check: FAILED");
    process.exit(1);
  }

  console.log("docs quality check: PASSED");
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

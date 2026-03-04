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
import { createI18n } from "../../lib/i18n.js";

function loadUiLang(root) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, ".sdd-forge", "config.json"), "utf8"));
    return raw.uiLang || "en";
  } catch (_) { return "en"; }
}

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
  const t = createI18n(loadUiLang(workRoot), { domain: "messages" });
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
    console.log(t("review.noChapters", { dir: targetDir }));
    process.exit(1);
  }

  console.log(t("review.foundChapters", { count: chapterFiles.length }));

  const MIN_LINES = 15;
  let fail = 0;

  for (const f of chapterFiles) {
    const filePath = path.join(targetDir, f);

    if (!fs.existsSync(filePath)) {
      console.log(t("review.missingFile", { path: filePath }));
      fail = 1;
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    // Line count check
    if (lines.length < MIN_LINES) {
      console.log(t("review.tooShort", { lines: lines.length, file: f }));
      fail = 1;
    }

    // H1 heading check
    if (!lines.some((line) => /^# /.test(line))) {
      console.log(t("review.missingH1", { file: f }));
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
      console.log(t("review.unfilledText", { count: unfilled, file: f }));
    }
  }

  // Unfilled @data directive check (FAIL)
  for (const f of chapterFiles) {
    const filePath = path.join(targetDir, f);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    let unfilledData = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*<!--\s*@data\s*:/.test(lines[i])) {
        const nextLine = (lines[i + 1] || "").trim();
        if (nextLine === "") {
          unfilledData++;
        }
      }
    }
    if (unfilledData > 0) {
      console.log(t("review.unfilledData", { count: unfilledData, file: f }));
      fail = 1;
    }
  }

  // MANUAL block matching check (WARN)
  for (const f of chapterFiles) {
    const filePath = path.join(targetDir, f);
    const content = fs.readFileSync(filePath, "utf8");
    const starts = (content.match(/<!--\s*MANUAL:START\s*-->/g) || []).length;
    const ends = (content.match(/<!--\s*MANUAL:END\s*-->/g) || []).length;
    if (starts !== ends) {
      console.log(t("review.manualMismatch", { starts, ends, file: f }));
    }
  }

  // analysis.json existence and freshness check (WARN)
  const analysisPath = path.join(workRoot, ".sdd-forge", "output", "analysis.json");
  if (!fs.existsSync(analysisPath)) {
    console.log(t("review.analysisNotFound"));
  } else {
    const analysisMtime = fs.statSync(analysisPath).mtimeMs;
    const projectFiles = ["package.json", "composer.json"];
    for (const pf of projectFiles) {
      const pfPath = path.join(workRoot, pf);
      if (fs.existsSync(pfPath) && fs.statSync(pfPath).mtimeMs > analysisMtime) {
        console.log(t("review.analysisStale", { file: pf }));
        break;
      }
    }
  }

  // README.md check (warn only)
  if (!fs.existsSync(path.join(workRoot, "README.md"))) {
    console.log(t("review.readmeNotFound"));
  }

  if (fail !== 0) {
    console.log(t("review.failed"));
    process.exit(1);
  }

  console.log(t("review.passed"));
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

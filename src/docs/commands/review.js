#!/usr/bin/env node
/**
 * src/docs/commands/review.js
 *
 * docs 品質チェック。
 * 章ファイル（NN_*.md）の基本構造を検証する。
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig, loadLang, sddOutputDir } from "../../lib/config.js";
import { createI18n } from "../../lib/i18n.js";
import { resolveOutputConfig } from "../../lib/types.js";
import { getChapterFiles } from "../lib/command-context.js";

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args, { flags: [], options: [] });

  if (opts.help) {
    const tu = createI18n(loadLang(repoRoot()));
    const h = tu.raw("help.cmdHelp.review");
    console.log(h.usage);
    console.log("");
    console.log(`  ${h.desc}`);
    console.log(`  ${h.descDetail}`);
    return;
  }

  const root = repoRoot();
  const t = createI18n(loadLang(root), { domain: "messages" });
  const targetDir = args.find((a) => !a.startsWith("-")) || path.join(root, "docs");

  // Discover chapter files (NN_*.md)
  let chapterFiles = [];
  if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
    chapterFiles = getChapterFiles(targetDir);
  }

  if (chapterFiles.length === 0) {
    throw new Error(t("review.noChapters", { dir: targetDir }));
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

    // Unfilled {{text}} directive check
    let unfilled = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/<!--\s*\{\{text\b/.test(lines[i])) {
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

  // Unfilled {{data}} directive check (FAIL)
  for (const f of chapterFiles) {
    const filePath = path.join(targetDir, f);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    let unfilledData = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/<!--\s*\{\{data\s*:/.test(lines[i])) {
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

  // analysis.json existence and freshness check (WARN)
  const analysisPath = path.join(sddOutputDir(root), "analysis.json");
  if (!fs.existsSync(analysisPath)) {
    console.log(t("review.analysisNotFound"));
  } else {
    const analysisMtime = fs.statSync(analysisPath).mtimeMs;
    const projectFiles = ["package.json", "composer.json"];
    for (const pf of projectFiles) {
      const pfPath = path.join(root, pf);
      if (fs.existsSync(pfPath) && fs.statSync(pfPath).mtimeMs > analysisMtime) {
        console.log(t("review.analysisStale", { file: pf }));
        break;
      }
    }
  }

  // README.md check (warn only)
  if (!fs.existsSync(path.join(root, "README.md"))) {
    console.log(t("review.readmeNotFound"));
  }

  // Multi-language: check non-default language directories
  try {
    const cfgRaw = loadConfig(root);
    const outputCfg = resolveOutputConfig(cfgRaw);
    if (outputCfg.isMultiLang) {
      const docsBase = path.join(root, "docs");
      const nonDefaultLangs = outputCfg.languages.filter((l) => l !== outputCfg.default);
      for (const lang of nonDefaultLangs) {
        const langDir = path.join(docsBase, lang);
        if (!fs.existsSync(langDir)) {
          console.log(`WARN: docs/${lang}/ directory missing for configured language '${lang}'`);
          continue;
        }
        const langFiles = getChapterFiles(langDir);
        if (langFiles.length === 0) {
          console.log(`WARN: docs/${lang}/ has no chapter files`);
          continue;
        }
        for (const f of langFiles) {
          const filePath = path.join(langDir, f);
          const content = fs.readFileSync(filePath, "utf8");
          const lines = content.split("\n");
          if (lines.length < MIN_LINES) {
            console.log(t("review.tooShort", { lines: lines.length, file: `${lang}/${f}` }));
            fail = 1;
          }
          if (!lines.some((line) => /^# /.test(line))) {
            console.log(t("review.missingH1", { file: `${lang}/${f}` }));
            fail = 1;
          }
        }
      }
    }
  } catch (_) {
    // config not available — skip multi-lang check
  }

  if (fail !== 0) {
    throw new Error(t("review.failed"));
  }

  console.log(t("review.passed"));
}

export { main };

runIfDirect(import.meta.url, main);

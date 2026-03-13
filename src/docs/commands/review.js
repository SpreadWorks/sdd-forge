#!/usr/bin/env node
/**
 * src/docs/commands/review.js
 *
 * docs 品質チェック。
 * 章ファイルの基本構造を検証する。
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig, sddOutputDir } from "../../lib/config.js";
import { translate } from "../../lib/i18n.js";
import { resolveOutputConfig, resolveType } from "../../lib/types.js";
import { getChapterFiles } from "../lib/command-context.js";
import { collectOutputs, compareOutputs, snapshotDir } from "./snapshot.js";
import { parseDirectives } from "../lib/directive-parser.js";

// ---------------------------------------------------------------------------
// Generated output integrity checks
// ---------------------------------------------------------------------------

// Detect residual block directives that should have been stripped
const RESIDUAL_BLOCK_RE = /^<!--\s*@(block:\s*[\w-]+|endblock|extends|parent)\s*-->$/;

/**
 * Strip inline code spans from a line.
 * Returns the line with backtick-enclosed content removed.
 */
function stripInlineCode(line) {
  return line.replace(/`[^`]+`/g, "");
}

/**
 * Test if a line matches a pattern, ignoring inline code spans.
 */
function testIgnoringInlineCode(line, regex) {
  return regex.test(stripInlineCode(line));
}

/**
 * Check a file's content for output integrity issues.
 *
 * @param {string} content - File content
 * @returns {{ exposedDirectives: number, brokenComments: boolean, residualBlocks: number }}
 */
function checkOutputIntegrity(content) {
  const lines = content.split("\n");
  let exposedDirectives = 0;
  let residualBlocks = 0;
  let inCodeBlock = false;

  for (const line of lines) {
    // Track fenced code blocks (``` or ~~~)
    if (/^(`{3,}|~{3,})/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Strip HTML comments and inline code spans before checking
    const stripped = line
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/`[^`]+`/g, "");

    // Detect bare {{data:...}} or {{text:...}} or {{/data}} or {{/text}} outside comments and code
    if (/\{\{(data\s*:|text\s*[\[:]|\/data\}\}|\/text\}\})/.test(stripped)) {
      exposedDirectives++;
    }

    if (RESIDUAL_BLOCK_RE.test(line.trim())) {
      residualBlocks++;
    }
  }

  // Check for unbalanced HTML comments (exclude code blocks)
  let commentOpens = 0;
  let commentCloses = 0;
  inCodeBlock = false;
  for (const line of lines) {
    if (/^(`{3,}|~{3,})/.test(line.trim())) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    const o = line.match(/<!--/g);
    const c = line.match(/-->/g);
    if (o) commentOpens += o.length;
    if (c) commentCloses += c.length;
  }
  const brokenComments = commentOpens !== commentCloses;

  return { exposedDirectives, brokenComments, residualBlocks };
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args, { flags: [], options: [] });

  if (opts.help) {
    const tu = translate();
    const h = tu.raw("ui:help.cmdHelp.review");
    console.log(h.usage);
    console.log("");
    console.log(`  ${h.desc}`);
    console.log(`  ${h.descDetail}`);
    return;
  }

  const root = repoRoot();
  const t = translate();
  const targetDir = args.find((a) => !a.startsWith("-")) || path.join(root, "docs");
  const config = loadConfig(root);
  const type = resolveType(config.type || "");

  // Discover chapter files
  let chapterFiles = [];
  if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
    chapterFiles = getChapterFiles(targetDir, { type, configChapters: config.chapters });
  }

  if (chapterFiles.length === 0) {
    throw new Error(t("messages:review.noChapters", { dir: targetDir }));
  }

  console.log(t("messages:review.foundChapters", { count: chapterFiles.length }));

  const MIN_LINES = 15;
  let fail = 0;

  for (const f of chapterFiles) {
    const filePath = path.join(targetDir, f);

    if (!fs.existsSync(filePath)) {
      console.log(t("messages:review.missingFile", { path: filePath }));
      fail = 1;
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    // Line count check
    if (lines.length < MIN_LINES) {
      console.log(t("messages:review.tooShort", { lines: lines.length, file: f }));
      fail = 1;
    }

    // H1 heading check
    if (!lines.some((line) => /^# /.test(line))) {
      console.log(t("messages:review.missingH1", { file: f }));
      fail = 1;
    }

    // Unfilled {{text}} directive check (block structure: start tag → content → end tag)
    let unfilled = 0;
    {
      let inFence = false;
      for (let i = 0; i < lines.length; i++) {
        if (/^(`{3,}|~{3,})/.test(lines[i].trim())) { inFence = !inFence; continue; }
        if (inFence) continue;
        if (!testIgnoringInlineCode(lines[i], /<!--\s*\{\{text\b/)) continue;
        // 終了タグまでの間に非空行があるかチェック
        let hasContent = false;
        for (let j = i + 1; j < lines.length; j++) {
          if (/^<!--\s*\{\{\/text\}\}\s*-->$/.test(lines[j].trim())) break;
          if (lines[j].trim() !== "") { hasContent = true; break; }
        }
        if (!hasContent) unfilled++;
      }
    }
    if (unfilled > 0) {
      console.log(t("messages:review.unfilledText", { count: unfilled, file: f }));
    }
  }

  // Unfilled {{data}} directive check (WARN — data may not yet be available)
  for (const f of chapterFiles) {
    const filePath = path.join(targetDir, f);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    let unfilledData = 0;
    let inFence = false;
    for (let i = 0; i < lines.length; i++) {
      if (/^(`{3,}|~{3,})/.test(lines[i].trim())) { inFence = !inFence; continue; }
      if (inFence) continue;
      if (!testIgnoringInlineCode(lines[i], /<!--\s*\{\{data\s*:/)) continue;
      let hasContent = false;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^<!--\s*\{\{\/data\}\}\s*-->$/.test(lines[j].trim())) break;
        if (lines[j].trim() !== "") { hasContent = true; break; }
      }
      if (!hasContent) unfilledData++;
    }
    if (unfilledData > 0) {
      console.log(t("messages:review.unfilledData", { count: unfilledData, file: f }));
    }
  }

  // Output integrity check (chapters + README.md)
  const integrityTargets = chapterFiles.map((f) => ({ label: f, path: path.join(targetDir, f) }));
  const readmePath = path.join(root, "README.md");
  if (fs.existsSync(readmePath)) {
    integrityTargets.push({ label: "README.md", path: readmePath });
  }

  for (const target of integrityTargets) {
    const content = fs.readFileSync(target.path, "utf8");
    const result = checkOutputIntegrity(content);
    if (result.exposedDirectives > 0) {
      console.log(t("messages:review.exposedDirective", { count: result.exposedDirectives, file: target.label }));
      fail = 1;
    }
    if (result.brokenComments) {
      console.log(t("messages:review.brokenComment", { file: target.label }));
      fail = 1;
    }
    if (result.residualBlocks > 0) {
      console.log(t("messages:review.residualBlock", { count: result.residualBlocks, file: target.label }));
      fail = 1;
    }
  }

  // analysis.json existence and freshness check (WARN)
  const analysisPath = path.join(sddOutputDir(root), "analysis.json");
  if (!fs.existsSync(analysisPath)) {
    console.log(t("messages:review.analysisNotFound"));
  } else {
    const analysisMtime = fs.statSync(analysisPath).mtimeMs;
    const projectFiles = ["package.json", "composer.json"];
    for (const pf of projectFiles) {
      const pfPath = path.join(root, pf);
      if (fs.existsSync(pfPath) && fs.statSync(pfPath).mtimeMs > analysisMtime) {
        console.log(t("messages:review.analysisStale", { file: pf }));
        break;
      }
    }
  }

  // README.md check (warn only)
  if (!fs.existsSync(path.join(root, "README.md"))) {
    console.log(t("messages:review.readmeNotFound"));
  }

  // Multi-language: check non-default language directories
  try {
    const outputCfg = resolveOutputConfig(config);
    if (outputCfg.isMultiLang) {
      const docsBase = path.join(root, "docs");
      const nonDefaultLangs = outputCfg.languages.filter((l) => l !== outputCfg.default);
      for (const lang of nonDefaultLangs) {
        const langDir = path.join(docsBase, lang);
        if (!fs.existsSync(langDir)) {
          console.log(`WARN: docs/${lang}/ directory missing for configured language '${lang}'`);
          continue;
        }
        const langFiles = getChapterFiles(langDir, { type, configChapters: config.chapters });
        if (langFiles.length === 0) {
          console.log(`WARN: docs/${lang}/ has no chapter files`);
          continue;
        }
        for (const f of langFiles) {
          const filePath = path.join(langDir, f);
          const content = fs.readFileSync(filePath, "utf8");
          const lines = content.split("\n");
          const label = `${lang}/${f}`;
          if (lines.length < MIN_LINES) {
            console.log(t("messages:review.tooShort", { lines: lines.length, file: label }));
            fail = 1;
          }
          if (!lines.some((line) => /^# /.test(line))) {
            console.log(t("messages:review.missingH1", { file: label }));
            fail = 1;
          }
          const result = checkOutputIntegrity(content);
          if (result.exposedDirectives > 0) {
            console.log(t("messages:review.exposedDirective", { count: result.exposedDirectives, file: label }));
            fail = 1;
          }
          if (result.brokenComments) {
            console.log(t("messages:review.brokenComment", { file: label }));
            fail = 1;
          }
          if (result.residualBlocks > 0) {
            console.log(t("messages:review.residualBlock", { count: result.residualBlocks, file: label }));
            fail = 1;
          }
        }
      }
    }
  } catch (_) {
    // config not available — skip multi-lang check
  }

  // Analysis coverage check (WARN only — does not cause FAIL)
  if (fs.existsSync(analysisPath)) {
    const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
    const META_KEYS = new Set(["analyzedAt", "enrichedAt", "generatedAt", "files", "root"]);
    const analysisCategories = Object.keys(analysis).filter((k) => !META_KEYS.has(k));

    if (analysisCategories.length > 0) {
      // Collect all data directive sources referenced in docs
      const referencedSources = new Set();
      const allDocsFiles = [...chapterFiles.map((f) => path.join(targetDir, f))];
      const readmePath2 = path.join(root, "README.md");
      if (fs.existsSync(readmePath2)) allDocsFiles.push(readmePath2);

      for (const fp of allDocsFiles) {
        if (!fs.existsSync(fp)) continue;
        const content = fs.readFileSync(fp, "utf8");
        const directives = parseDirectives(content);
        for (const d of directives) {
          if (d.type === "data") referencedSources.add(d.source);
        }
      }

      for (const cat of analysisCategories) {
        if (!referencedSources.has(cat)) {
          const entries = analysis[cat];
          const count = Array.isArray(entries) ? entries.length
            : (typeof entries === "object" && entries !== null) ? Object.keys(entries).length
            : 1;
          console.log(`[WARN] uncovered analysis category: ${cat} (${count} entries)`);
        }
      }
    }
  }

  // Snapshot check (WARN only — does not cause FAIL)
  const snapDir = snapshotDir(root);
  if (fs.existsSync(path.join(snapDir, "manifest.json"))) {
    const current = collectOutputs(root);
    const saved = JSON.parse(fs.readFileSync(path.join(snapDir, "manifest.json"), "utf8"));
    const savedOutputs = {};
    for (const [key, safeName] of Object.entries(saved)) {
      const fp = path.join(snapDir, safeName);
      if (fs.existsSync(fp)) savedOutputs[key] = fs.readFileSync(fp, "utf8");
    }
    const snapResult = compareOutputs(current, savedOutputs);
    if (!snapResult.pass) {
      console.log(`[WARN] snapshot: ${snapResult.diffs.length} diff(s) detected`);
      for (const d of snapResult.diffs) {
        console.log(`  [${d.type}] ${d.key}`);
      }
    }
  }

  if (fail !== 0) {
    throw new Error(t("messages:review.failed"));
  }

  console.log(t("messages:review.passed"));
}

export { main };

runIfDirect(import.meta.url, main);

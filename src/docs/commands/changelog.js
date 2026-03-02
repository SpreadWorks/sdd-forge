#!/usr/bin/env node
/**
 * src/docs/commands/changelog.js
 *
 * specs/ を走査して change_log.md を生成する。
 * 既存ファイルの MANUAL ブロックを保持する。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sourceRoot, repoRoot, parseArgs } from "../../lib/cli.js";

/**
 * パイプ文字をエスケープし、空白を正規化する。
 */
function sanitize(text) {
  return text
    .replace(/[\t\r\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\|/g, "\\|");
}

/**
 * spec.md から必要なメタ情報を抽出する。
 */
function parseSpecFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  // title
  let title = "";
  for (const line of lines) {
    const m = line.match(/^# (.*)$/);
    if (m) {
      title = m[1].replace(/^Feature Specification:\s*/, "");
      break;
    }
  }
  if (!title) {
    // first non-empty line
    for (const line of lines) {
      if (line.trim()) {
        title = line.trim();
        break;
      }
    }
  }
  if (!title || title === "yaml") {
    title = "";
  }

  // metadata fields
  let created = "";
  let status = "";
  let branch = "";
  let inputLine = "";

  for (const line of lines) {
    const createdMatch = line.match(/^\*\*Created\*\*:\s*(.*?)\s*$/);
    if (createdMatch && !created) created = createdMatch[1];

    const statusMatch = line.match(/^\*\*Status\*\*:\s*(.*?)\s*$/);
    if (statusMatch && !status) status = statusMatch[1];

    const branchMatch = line.match(/^\*\*Feature Branch\*\*:\s*(.*?)\s*$/);
    if (branchMatch && !branch) branch = branchMatch[1].replace(/`/g, "");

    const inputMatch = line.match(/^\*\*Input\*\*:\s*(.*?)\s*$/);
    if (inputMatch && !inputLine) inputLine = inputMatch[1];
  }

  // fallback: first bullet in ## Scope
  if (!inputLine) {
    let inScope = false;
    for (const line of lines) {
      if (/^## Scope/.test(line)) {
        inScope = true;
        continue;
      }
      if (inScope && /^## /.test(line)) break;
      if (inScope && /^- /.test(line)) {
        inputLine = line.replace(/^- /, "");
        break;
      }
    }
  }

  return {
    title: sanitize(title || "n/a"),
    created: sanitize(created || "n/a"),
    status: sanitize(status || "n/a"),
    branch: sanitize(branch || "n/a"),
    inputLine: sanitize(inputLine || "n/a"),
  };
}

/**
 * ディレクトリ名からシリーズ情報を抽出する。
 */
function parseDirName(dirName) {
  let m = dirName.match(/^([0-9]{3})[-_](.+)$/);
  if (m) return { number: parseInt(m[1], 10), series: m[2], isBackup: false };

  m = dirName.match(/^bak\.([0-9]{3})[-_](.+)$/);
  if (m) return { number: parseInt(m[1], 10), series: m[2], isBackup: true };

  return null;
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args, { flags: [], options: [] });

  if (opts.help) {
    console.log("Usage: sdd-forge changelog [<output-file>]");
    console.log("");
    console.log("  specs/ を走査して change_log.md を生成する。");
    console.log("  引数なしの場合は ${SDD_SOURCE_ROOT}/docs/change_log.md に出力する。");
    process.exit(0);
  }

  const srcRoot = sourceRoot();
  const specsDir = path.join(srcRoot, "specs");
  const outFileArg = args.find((a) => !a.startsWith("-"));
  const outFile = outFileArg || path.join(repoRoot(), "docs", "change_log.md");

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  // Preserve existing MANUAL block
  let manualBlock = "<!-- MANUAL:START -->\n<!-- MANUAL:END -->";
  if (fs.existsSync(outFile)) {
    const existing = fs.readFileSync(outFile, "utf8");
    const manualMatch = existing.match(/<!-- MANUAL:START -->[\s\S]*?<!-- MANUAL:END -->/);
    if (manualMatch) {
      manualBlock = manualMatch[0];
    }
  }

  // Collect spec entries
  const entries = [];

  if (fs.existsSync(specsDir)) {
    for (const dirName of fs.readdirSync(specsDir).sort()) {
      const specFile = path.join(specsDir, dirName, "spec.md");
      if (!fs.existsSync(specFile)) continue;

      const parsed = parseDirName(dirName);
      if (!parsed) continue;

      const meta = parseSpecFile(specFile);

      // Discover linked files
      const dirPath = path.join(specsDir, dirName);
      const linkedFiles = fs
        .readdirSync(dirPath)
        .filter((f) => f.endsWith(".md"))
        .sort();

      entries.push({
        dirName,
        series: parsed.series,
        number: parsed.number,
        isBackup: parsed.isBackup,
        ...meta,
        links: linkedFiles,
      });
    }
  }

  // Find latest non-backup per series
  const latestBySeries = {};
  for (const entry of entries) {
    if (entry.isBackup) continue;
    const key = entry.series;
    if (!latestBySeries[key] || entry.number > latestBySeries[key].number) {
      latestBySeries[key] = entry;
    }
  }
  const latestEntries = Object.values(latestBySeries).sort((a, b) =>
    a.series.localeCompare(b.series)
  );

  // Generate output
  const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
  const out = [];

  out.push("<!-- AUTO-GEN:START -->");
  out.push("# Change Log");
  out.push("");
  out.push("## 説明");
  out.push("");
  out.push("`specs/` を一次情報として、仕様のインデックスと概要を記録する。");
  out.push("本ファイルは `npm run sdd:init` で自動更新される。");
  out.push("");
  out.push("## 内容");
  out.push("");
  out.push("### 更新日時");
  out.push("");
  out.push(`- generated_at: ${now}`);
  out.push("");
  out.push("### シリーズ最新インデックス");
  out.push("");
  out.push("| series | latest | status | created | spec |");
  out.push("| --- | --- | --- | --- | --- |");
  for (const e of latestEntries) {
    out.push(`| \`${e.series}\` | \`${e.dirName}\` | ${e.status} | ${e.created} | [spec](../specs/${e.dirName}/spec.md) |`);
  }
  out.push("");
  out.push("### 全spec一覧");
  out.push("");
  out.push("| dir | status | created | title | summary | files |");
  out.push("| --- | --- | --- | --- | --- | --- |");

  const sortedEntries = [...entries].sort((a, b) => a.dirName.localeCompare(b.dirName));
  for (const e of sortedEntries) {
    let fileLinks;
    if (e.links.length > 1) {
      fileLinks = e.links.map((f) => `[${f}](../specs/${e.dirName}/${f})`).join(", ");
    } else {
      const f = e.links[0] || "spec.md";
      fileLinks = `[${f}](../specs/${e.dirName}/${f})`;
    }
    out.push(`| \`${e.dirName}\` | ${e.status} | ${e.created} | ${e.title} | ${e.inputLine} | ${fileLinks} |`);
  }

  out.push("<!-- AUTO-GEN:END -->");
  out.push("");
  out.push(manualBlock);
  out.push("");

  fs.writeFileSync(outFile, out.join("\n"));
  console.log(`generated change log: ${outFile}`);
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

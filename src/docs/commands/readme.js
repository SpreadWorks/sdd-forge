#!/usr/bin/env node
/**
 * sdd-forge/engine/readme.js
 *
 * docs/ 配下の章ファイルから README.md を自動生成する。
 * 既存 README.md の MANUAL ブロックは保持する。
 *
 * Usage:
 *   node sdd-forge/engine/readme.js [--dry-run] [--help]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadJsonFile, loadPackageField } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { resolveChain, resolveReadmeTemplate } from "../lib/template-merger.js";

// npm パッケージ: テンプレートはパッケージ自身の templates/ に同梱される
const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ---------------------------------------------------------------------------
// docs/ 解析
// ---------------------------------------------------------------------------

/**
 * docs/NN_*.md を番号順に取得する。
 */
function listChapterFiles(root) {
  const docsDir = path.join(root, "docs");
  if (!fs.existsSync(docsDir)) return [];
  return fs
    .readdirSync(docsDir)
    .filter((f) => /^\d{2}_.*\.md$/.test(f))
    .sort()
    .map((f) => path.join(docsDir, f));
}

/**
 * 章ファイルからタイトルと説明を抽出する。
 *
 * - タイトル: 先頭の `# NN. ...` 行
 * - 説明: `## 説明` 〜 `## 内容` 間のテキスト（ディレクティブ行を除く）
 */
function parseChapter(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  // タイトル抽出
  const titleLine = lines.find((l) => /^# \d{2}\./.test(l));
  const title = titleLine ? titleLine.replace(/^# /, "") : path.basename(filePath, ".md");

  // 説明抽出: ## 説明 〜 ## 内容
  let inDesc = false;
  const descLines = [];
  for (const line of lines) {
    if (/^## 説明/.test(line)) {
      inDesc = true;
      continue;
    }
    if (inDesc && /^## /.test(line)) {
      break;
    }
    if (inDesc) {
      // ディレクティブ行はスキップ
      if (/<!--\s*@(text|data)\s*(\[[^\]]*\])?\s*:/.test(line)) continue;
      descLines.push(line);
    }
  }

  const description = descLines.join("\n").trim() || "（未記載）";
  const fileName = path.basename(filePath);

  return { title, description, fileName };
}

// ---------------------------------------------------------------------------
// MANUAL ブロック保持
// ---------------------------------------------------------------------------

/**
 * 既存 README.md から MANUAL ブロックの内容を抽出する。
 */
function extractManualBlock(filePath) {
  if (!fs.existsSync(filePath)) return "";
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(
    /<!-- MANUAL:START -->\n([\s\S]*?)<!-- MANUAL:END -->/,
  );
  return match ? match[1] : "";
}

// ---------------------------------------------------------------------------
// テンプレート生成
// ---------------------------------------------------------------------------

function generateReadme(chapters, manualContent, templatePath, root) {
  const chapterTable = chapters
    .map(
      (ch) =>
        `| [${ch.title}](docs/${ch.fileName}) | ${ch.description.split("\n")[0]} |`,
    )
    .join("\n");

  const pkgName = loadPackageField(root, "name") || path.basename(root);
  const pkgDescription = loadPackageField(root, "description") || "";

  const template = fs.readFileSync(templatePath, "utf8");
  return template
    .replace(/\{\{CHAPTER_TABLE\}\}/g, chapterTable)
    .replace(/\{\{MANUAL_CONTENT\}\}/g, manualContent)
    .replace(/\{\{PROJECT_NAME\}\}/g, pkgName)
    .replace(/\{\{PACKAGE_NAME\}\}/g, pkgName)
    .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, pkgDescription);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  const root = repoRoot(import.meta.url);
  const sddConfig = loadJsonFile(path.join(root, ".sdd-forge", "config.json"));

  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run"],
  });

  if (cli.help) {
    console.log(`Usage: node sdd-forge/engine/readme.js [--dry-run]

Options:
  --dry-run   差分を表示するが書き込まない
  --help      このヘルプを表示`);
    process.exit(0);
  }

  const lang = sddConfig?.lang || "ja";
  const type = sddConfig?.type;

  if (!type) {
    console.log("[readme] .sdd-forge/config.json に type が設定されていません。スキップします。");
    return;
  }

  const resolvedType = resolveType(type);
  const templatesRoot = path.join(PKG_DIR, "templates", "locale", lang);

  // テンプレート継承チェーンで README.md を探索
  let templatePath = null;
  try {
    const chain = resolveChain(templatesRoot, resolvedType);
    templatePath = resolveReadmeTemplate(chain, templatesRoot);
  } catch (_) {
    // 新構造がない場合、旧パスへフォールバック
  }

  // フォールバック: 旧フラットディレクトリ
  if (!templatePath) {
    templatePath = path.join(PKG_DIR, "templates", "locale", lang, type, "README.md");
  }

  if (!fs.existsSync(templatePath)) {
    console.log(`[readme] テンプレートが見つかりません (type=${type})。スキップします。`);
    return;
  }

  const chapters = listChapterFiles(root).map(parseChapter);
  const readmePath = path.join(root, "README.md");
  const manualContent = extractManualBlock(readmePath);
  const newContent = generateReadme(chapters, manualContent, templatePath, root);

  // 差分チェック
  if (fs.existsSync(readmePath)) {
    const current = fs.readFileSync(readmePath, "utf8");
    if (current === newContent) {
      console.log("[readme] No changes detected. Skipping write.");
      return;
    }
  }

  if (cli.dryRun) {
    console.log("[readme] --dry-run: would write README.md");
    console.log("---");
    console.log(newContent);
    return;
  }

  fs.writeFileSync(readmePath, newContent, "utf8");
  console.log("[readme] README.md updated.");
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

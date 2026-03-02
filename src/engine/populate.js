#!/usr/bin/env node
/**
 * sdd-forge/engine/populate.js
 *
 * ディレクティブベースのテンプレートエンジン。
 * analysis.json を読み、テンプレート内の @data ディレクティブを解決してレンダリングする。
 * @text はスキップしてログ出力する（後続タスクで LLM 連携を実装予定）。
 *
 * Usage:
 *   node sdd-forge/engine/populate.js [--dry-run] [--stdout]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseDirectives } from "./directive-parser.js";
import { RENDERERS } from "./renderers.js";
import { resolve as legacyResolve } from "./resolver.js";
import { createResolver } from "./resolvers/index.js";
import { repoRoot, parseArgs } from "../lib/cli.js";
import { loadConfig } from "../lib/config.js";
import { resolveType } from "../lib/types.js";

// ---------------------------------------------------------------------------
// テンプレートファイル処理
// ---------------------------------------------------------------------------

/**
 * 1 ファイルのディレクティブをすべて処理し、置換後のテキストを返す。
 *
 * @param {string} text     - テンプレート全文
 * @param {Object} analysis - analysis.json
 * @param {string} fileName - ログ出力用ファイル名
 * @param {function} [resolveFn] - カテゴリ解決関数（省略時は legacyResolve）
 * @returns {{ text: string, replaced: number, skipped: number }}
 */
function processTemplate(text, analysis, fileName, resolveFn) {
  const resolve = resolveFn || legacyResolve;
  const directives = parseDirectives(text);
  if (directives.length === 0) return { text, replaced: 0, skipped: 0 };

  const lines = text.split("\n");
  let replaced = 0;
  let skipped = 0;

  // 後ろから処理して行番号のズレを防ぐ
  for (let i = directives.length - 1; i >= 0; i--) {
    const d = directives[i];

    if (d.type === "text") {
      skipped++;
      console.error(`[populate] SKIP @text in ${fileName}:${d.line + 1}: ${d.prompt.slice(0, 60)}...`);
      continue;
    }

    if (d.type === "data") {
      const data = resolve(d.category, analysis);
      if (data === null) {
        console.error(`[populate] WARN: no data for category "${d.category}" in ${fileName}:${d.line + 1}`);
        continue;
      }

      const renderer = RENDERERS[d.renderer];
      if (!renderer) {
        console.error(`[populate] WARN: unknown renderer "${d.renderer}" in ${fileName}:${d.line + 1}`);
        continue;
      }

      let rendered;
      if (d.renderer === "mermaid-er") {
        rendered = renderer(data);
      } else {
        rendered = renderer(data, d.labels);
      }

      // 以前のレンダリング結果を除去（ディレクティブ直後のテーブル/コードブロックを除去）
      // 次の区切り行（見出し、ディレクティブ、空行2連続）までを除去
      let endLine = d.line + 1;
      while (endLine < lines.length) {
        const ln = lines[endLine].trim();
        // 次の見出し、ディレクティブ、または空行で停止
        if (ln.startsWith("#") || ln.startsWith("<!-- @")) break;
        if (ln === "" && endLine + 1 < lines.length && lines[endLine + 1].trim() === "") break;
        if (ln === "" && endLine + 1 < lines.length && lines[endLine + 1].trim().startsWith("#")) break;
        if (ln === "" && endLine + 1 < lines.length && lines[endLine + 1].trim().startsWith("<!-- @")) break;
        // テーブル行、コードブロック行、テキスト行を全て除去対象
        endLine++;
      }

      // ディレクティブ行 + 既存データ行を新しいレンダリング結果に置換
      const newLines = [d.raw, rendered];
      lines.splice(d.line, endLine - d.line, ...newLines);
      replaced++;
    }
  }

  let result = lines.join("\n");
  if (!result.endsWith("\n")) result += "\n";
  return { text: result, replaced, skipped };
}

// ---------------------------------------------------------------------------
// populateFromAnalysis (エクスポート用: forge.js などから呼び出し可能)
// ---------------------------------------------------------------------------
export function populateFromAnalysis(root, analysis, resolveFn) {
  if (!analysis) return { populated: false, files: [] };

  const docsDir = path.join(root, "docs");
  const changedFiles = [];

  const docsFiles = fs.readdirSync(docsDir).filter((f) => /^\d{2}_/.test(f) && f.endsWith(".md")).sort();

  for (const file of docsFiles) {
    const filePath = path.join(docsDir, file);
    const original = fs.readFileSync(filePath, "utf8");
    const result = processTemplate(original, analysis, file, resolveFn);

    if (result.replaced > 0) {
      fs.writeFileSync(filePath, result.text);
      changedFiles.push(file);
    }
  }

  return { populated: changedFiles.length > 0, files: changedFiles };
}

// ---------------------------------------------------------------------------
// CLI メイン
// ---------------------------------------------------------------------------
async function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run", "--stdout"],
    defaults: { dryRun: false, stdout: false },
  });
  if (cli.help) {
    console.log([
      "Usage: node sdd-forge/engine/populate.js [options]",
      "",
      "Options:",
      "  --dry-run   変更内容を表示するだけでファイル書き込みしない",
      "  --stdout    各ファイルの変更行数を表示",
      "  -h, --help  このヘルプを表示",
    ].join("\n"));
    return;
  }

  const root = repoRoot(import.meta.url);
  const analysisPath = path.join(root, ".sdd-forge", "output", "analysis.json");

  if (!fs.existsSync(analysisPath)) {
    console.error(`[populate] ERROR: analysis.json not found: ${analysisPath}`);
    console.error("[populate] Run 'sdd-forge scan' first.");
    process.exit(1);
  }

  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));

  // type に基づくリゾルバを生成
  let resolveFn;
  try {
    const cfg = loadConfig(root);
    const type = resolveType(cfg.type || "php-mvc");
    const resolver = await createResolver(type, root);
    resolveFn = (category, a) => resolver.resolve(category, a);
    console.error(`[populate] resolver: ${type}`);
  } catch (_) {
    // フォールバック: レガシーリゾルバ
    resolveFn = legacyResolve;
    console.error("[populate] resolver: legacy (fallback)");
  }

  const docsDir = path.join(root, "docs");
  const docsFiles = fs.readdirSync(docsDir).filter((f) => /^\d{2}_/.test(f) && f.endsWith(".md")).sort();

  const changedFiles = new Set();
  let totalReplaced = 0;
  let totalSkipped = 0;

  for (const file of docsFiles) {
    const filePath = path.join(docsDir, file);
    const original = fs.readFileSync(filePath, "utf8");
    const result = processTemplate(original, analysis, file, resolveFn);

    totalReplaced += result.replaced;
    totalSkipped += result.skipped;

    if (result.replaced > 0) {
      changedFiles.add(file);
      const linesBefore = original.split("\n").length;
      const linesAfter = result.text.split("\n").length;

      if (cli.dryRun || cli.stdout) {
        console.log(`[populate] ${file}: ${linesBefore} → ${linesAfter} lines (${linesAfter - linesBefore > 0 ? "+" : ""}${linesAfter - linesBefore})`);
      }

      if (!cli.dryRun) {
        fs.writeFileSync(filePath, result.text);
        console.error(`[populate] UPDATED: ${file}`);
      } else {
        console.error(`[populate] DRY-RUN: ${file} would be updated`);
      }
    }
  }

  console.error(`[populate] Done. ${changedFiles.size} file(s) updated. @data: ${totalReplaced} replaced, @text: ${totalSkipped} skipped.`);
}

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

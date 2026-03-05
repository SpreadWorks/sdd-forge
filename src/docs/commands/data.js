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
import { parseDirectives } from "../lib/directive-parser.js";
// RENDERERS は DataSource メソッドが直接レンダリングするため不要
import { createResolver } from "../lib/resolver-factory.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { createLogger } from "../../lib/progress.js";
import { createI18n } from "../../lib/i18n.js";

const logger = createLogger("data");

// ---------------------------------------------------------------------------
// テンプレートファイル処理
// ---------------------------------------------------------------------------

/**
 * 1 ファイルのディレクティブをすべて処理し、置換後のテキストを返す。
 *
 * @param {string} text     - テンプレート全文
 * @param {Object} analysis - analysis.json
 * @param {string} fileName - ログ出力用ファイル名
 * @param {function} [resolveFn] - (source, method, analysis, labels) => rendered string
 * @returns {{ text: string, replaced: number, skipped: number }}
 */
function processTemplate(text, analysis, fileName, resolveFn) {
  if (!resolveFn) {
    throw new Error("resolveFn is required — run createResolver() first");
  }
  const resolve = resolveFn;
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
      logger.verbose(`SKIP @text in ${fileName}:${d.line + 1}: ${d.prompt.slice(0, 60)}...`);
      continue;
    }

    if (d.type === "data") {
      const rendered = resolve(d.source, d.method, analysis, d.labels);
      if (rendered === null || rendered === undefined) {
        logger.log(`WARN: no data for "${d.source}.${d.method}" in ${fileName}:${d.line + 1}`);
        continue;
      }

      if (d.inline) {
        // インライン: d.raw は完全なマッチ文字列（<!-- @data: ... -->old<!-- @enddata -->）
        // openTag 部分を抽出し、内容を差し替える
        const openTag = d.raw.match(/<!--\s*@data:\s*[\w.-]+\.[\w-]+\("[^"]*"\)\s*-->/)[0];
        const endTag = "<!-- @enddata -->";
        lines[d.line] = lines[d.line].replace(d.raw, `${openTag}${rendered}${endTag}`);
      } else if (d.endLine >= 0) {
        // ブロック: @data 行と @enddata 行の間を置換
        const endDataLine = lines[d.endLine];
        const newLines = [d.raw, rendered, endDataLine];
        lines.splice(d.line, d.endLine - d.line + 1, ...newLines);
      } else {
        // @enddata がない — スキップ
        logger.log(`WARN: missing @enddata for "${d.source}.${d.method}" in ${fileName}:${d.line + 1}`);
        continue;
      }
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
  if (!resolveFn) return { populated: false, files: [] };

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

  let uiLang = "en";
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, ".sdd-forge", "config.json"), "utf8"));
    uiLang = raw.uiLang || "en";
  } catch (_) { /* config read handled below */ }
  const t = createI18n(uiLang, { domain: "messages" });

  const analysisPath = path.join(root, ".sdd-forge", "output", "analysis.json");

  if (!fs.existsSync(analysisPath)) {
    logger.log(t("data.analysisNotFound", { path: analysisPath }));
    logger.log(t("data.runScanFirst"));
    process.exit(1);
  }

  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));

  // type に基づくリゾルバを生成
  let resolveFn;
  try {
    const cfg = loadConfig(root);
    const type = resolveType(cfg.type || "php-mvc");
    const resolver = await createResolver(type, root);
    resolveFn = (source, method, a, labels) => resolver.resolve(source, method, a, labels);
    logger.verbose(`resolver: ${type}`);
  } catch (err) {
    logger.log(t("data.resolverFailed", { message: err.message }));
    process.exit(1);
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
        console.log(`[data] ${file}: ${linesBefore} → ${linesAfter} lines (${linesAfter - linesBefore > 0 ? "+" : ""}${linesAfter - linesBefore})`);
      }

      if (!cli.dryRun) {
        fs.writeFileSync(filePath, result.text);
        logger.verbose(`UPDATED: ${file}`);
      } else {
        logger.verbose(`DRY-RUN: ${file} would be updated`);
      }
    }
  }

  const verb = cli.dryRun ? "would update" : "updated";
  logger.log(t("data.done", { count: changedFiles.size, verb, replaced: totalReplaced, skipped: totalSkipped }));
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

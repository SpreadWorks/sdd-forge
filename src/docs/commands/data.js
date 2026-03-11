#!/usr/bin/env node
/**
 * sdd-forge/engine/populate.js
 *
 * ディレクティブベースのテンプレートエンジン。
 * analysis.json を読み、テンプレート内の {{data}} ディレクティブを解決してレンダリングする。
 * {{text}} はスキップしてログ出力する（後続タスクで LLM 連携を実装予定）。
 *
 * Usage:
 *   node sdd-forge/engine/populate.js [--dry-run] [--stdout]
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { resolveDataDirectives } from "../lib/directive-parser.js";
import { createResolver } from "../lib/resolver-factory.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { sddOutputDir } from "../../lib/config.js";
import { createLogger } from "../../lib/progress.js";
import { translate } from "../../lib/i18n.js";
import { resolveCommandContext, getChapterFiles } from "../lib/command-context.js";

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
  let skipped = 0;

  const result = resolveDataDirectives(
    text,
    (source, method, labels) => resolveFn(source, method, analysis, labels),
    {
      onSkip(d) {
        if (d.type === "text") {
          skipped++;
          logger.verbose(`SKIP {{text}} in ${fileName}:${d.line + 1}: ${d.prompt.slice(0, 60)}...`);
        }
      },
    },
  );

  let out = result.text;
  if (!out.endsWith("\n")) out += "\n";
  return { text: out, replaced: result.replaced, skipped };
}

// ---------------------------------------------------------------------------
// populateFromAnalysis (エクスポート用: forge.js などから呼び出し可能)
// ---------------------------------------------------------------------------
export function populateFromAnalysis(root, analysis, resolveFn, opts) {
  if (!analysis) return { populated: false, files: [] };
  if (!resolveFn) return { populated: false, files: [] };

  const docsDir = path.join(root, "docs");
  const changedFiles = [];

  const docsFiles = getChapterFiles(docsDir, { type: opts?.type });

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
async function main(ctx) {
  // CLI モード: 引数をパースしてコンテキストを構築
  if (!ctx) {
    const cli = parseArgs(process.argv.slice(2), {
      flags: ["--dry-run", "--stdout"],
      options: ["--docs-dir"],
      defaults: { dryRun: false, stdout: false, docsDir: "" },
    });
    if (cli.help) {
      const t = translate();
      const h = t.raw("ui:help.cmdHelp.data");
      const o = h.options;
      console.log([h.usage, "", h.desc, "", "Options:", `  ${o.dryRun}`, `  ${o.stdout}`, `  ${o.help}`].join("\n"));
      return;
    }
    ctx = resolveCommandContext(cli);
    ctx.dryRun = cli.dryRun;
    ctx.stdout = cli.stdout;
  }

  const { root, type, docsDir, t } = ctx;

  const analysisPath = path.join(sddOutputDir(root), "analysis.json");

  if (!fs.existsSync(analysisPath)) {
    throw new Error(`${t("messages:data.analysisNotFound", { path: analysisPath })}\n${t("messages:data.runScanFirst")}`);
  }

  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));

  // type に基づくリゾルバを生成
  let resolveFn;
  try {
    const resolver = await createResolver(type, root, { docsDir });
    resolveFn = (source, method, a, labels) => resolver.resolve(source, method, a, labels);
    logger.verbose(`resolver: ${type}`);
  } catch (err) {
    throw new Error(t("messages:data.resolverFailed", { message: err.message }));
  }

  const docsFiles = getChapterFiles(docsDir, { type });

  // Determine relative path prefix for lang.links context
  const docsDirRel = path.relative(root, docsDir).replace(/\\/g, "/");

  const changedFiles = new Set();
  let totalReplaced = 0;
  let totalSkipped = 0;

  for (const file of docsFiles) {
    const filePath = path.join(docsDir, file);
    const original = fs.readFileSync(filePath, "utf8");
    // Inject file path context for lang.links resolver
    const wrappedResolveFn = (source, method, a, labels) => {
      if (source === "lang" && method === "links") {
        return resolveFn(source, method, a, [`${docsDirRel}/${file}`]);
      }
      if (source === "docs" && method === "langSwitcher") {
        return resolveFn(source, method, a, [labels[0] || "relative", `${docsDirRel}/${file}`]);
      }
      return resolveFn(source, method, a, labels);
    };
    const result = processTemplate(original, analysis, file, wrappedResolveFn);

    totalReplaced += result.replaced;
    totalSkipped += result.skipped;

    if (result.replaced > 0) {
      changedFiles.add(file);
      const linesBefore = original.split("\n").length;
      const linesAfter = result.text.split("\n").length;

      if (ctx.dryRun || ctx.stdout) {
        console.log(`[data] ${file}: ${linesBefore} → ${linesAfter} lines (${linesAfter - linesBefore > 0 ? "+" : ""}${linesAfter - linesBefore})`);
      }

      if (!ctx.dryRun) {
        fs.writeFileSync(filePath, result.text);
        logger.verbose(`UPDATED: ${file}`);
      } else {
        logger.verbose(`DRY-RUN: ${file} would be updated`);
      }
    }
  }

  const verb = ctx.dryRun ? "would update" : "updated";
  logger.log(t("messages:data.done", { count: changedFiles.size, verb, replaced: totalReplaced, skipped: totalSkipped }));
}

export { main };

runIfDirect(import.meta.url, main);

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
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadJsonFile, sddConfigPath } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { resolveChain, resolveChainWithFallback, mergeFile } from "../lib/template-merger.js";
import { createResolver } from "../lib/resolver-factory.js";
import { parseDirectives, replaceBlockDirective } from "../lib/directive-parser.js";
import { createLogger } from "../../lib/progress.js";
import { createI18n } from "../../lib/i18n.js";

const logger = createLogger("readme");

// ---------------------------------------------------------------------------
// docs/ 解析 (removed — now handled by DocsSource DataSource)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// テンプレート処理 ({{data}} ディレクティブ解決)
// ---------------------------------------------------------------------------

/**
 * テンプレート内の {{data}} ディレクティブを解決する。
 * processTemplate と同じロジックだが readme.js 用に独立。
 */
function resolveDataDirectives(text, resolveFn) {
  const directives = parseDirectives(text);
  if (directives.length === 0) return text;

  const lines = text.split("\n");

  // 後ろから処理
  for (let i = directives.length - 1; i >= 0; i--) {
    const d = directives[i];
    if (d.type !== "data") continue;

    const rendered = resolveFn(d.source, d.method, {}, d.labels);
    if (rendered === null || rendered === undefined) continue;

    if (d.inline) {
      const openTag = d.raw.match(/<!--\s*\{\{data:\s*[\w.-]+\.[\w-]+\("[^"]*"\)\}\}\s*-->/)[0];
      const endTag = "<!-- {{/data}} -->";
      lines[d.line] = lines[d.line].replace(d.raw, `${openTag}${rendered}${endTag}`);
    } else if (d.endLine >= 0) {
      replaceBlockDirective(lines, d, rendered);
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const root = repoRoot(import.meta.url);
  const sddConfig = loadJsonFile(sddConfigPath(root));

  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run"],
    options: ["--lang", "--output"],
    defaults: { lang: "", output: "" },
  });

  if (cli.help) {
    console.log(`Usage: node sdd-forge/engine/readme.js [--dry-run]

Options:
  --dry-run   差分を表示するが書き込まない
  --help      このヘルプを表示`);
    process.exit(0);
  }

  const lang = cli.lang || sddConfig?.output?.default;
  const type = sddConfig?.type;

  const t = createI18n(sddConfig?.lang || "en", { domain: "messages" });

  if (!type) {
    console.log(t("readme.noType"));
    return;
  }

  const resolvedType = resolveType(type);
  const projectLocalDir = path.join(root, ".sdd-forge", "templates", lang, "docs");
  const outputConfig = sddConfig?.output;
  const fallbackLangs = outputConfig?.languages?.filter((l) => l !== lang) || [];
  let chain;
  if (fallbackLangs.length > 0) {
    const { resolveAgent: resolveAgentFn } = await import("../../lib/agent.js");
    chain = resolveChainWithFallback(resolvedType, lang, projectLocalDir, {
      fallbackLangs,
      agent: resolveAgentFn(sddConfig),
      root,
    });
  } else {
    chain = resolveChain(resolvedType, lang, projectLocalDir);
  }
  const merged = mergeFile("README.md", chain);
  if (!merged) {
    logger.log(t("readme.noTemplate", { type }));
    return;
  }

  // マージ後のブロックディレクティブを除去
  const templateContent = merged
    .replace(/^<!-- @block: [\w-]+ -->\n?/gm, "")
    .replace(/^<!-- @endblock -->\n?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([^\n])\n(## )/g, "$1\n\n$2")
    .replace(/([^\n])\n(### )/g, "$1\n\n$2");

  // {{data}} ディレクティブを解決
  let resolveFn;
  try {
    const resolver = await createResolver(resolvedType, root);
    resolveFn = (source, method, a, labels) => resolver.resolve(source, method, a, labels);
  } catch (err) {
    logger.log(`resolver error: ${err.message}`);
    return;
  }

  const readmePath = cli.output ? path.resolve(root, cli.output) : path.join(root, "README.md");

  let resolved = resolveDataDirectives(templateContent, resolveFn);
  const newContent = resolved.endsWith("\n") ? resolved : resolved + "\n";

  // 差分チェック
  if (fs.existsSync(readmePath)) {
    const current = fs.readFileSync(readmePath, "utf8");
    if (current === newContent) {
      logger.log(t("readme.noChanges"));
      return;
    }
  }

  if (cli.dryRun) {
    logger.log(t("readme.dryRun"));
    console.log("---");
    console.log(newContent);
    return;
  }

  fs.writeFileSync(readmePath, newContent, "utf8");
  logger.log(t("readme.updated"));
}

export { main };

runIfDirect(import.meta.url, main);

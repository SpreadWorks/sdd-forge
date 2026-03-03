#!/usr/bin/env node
/**
 * sdd-forge/engine/init.js
 *
 * テンプレート継承チェーンをもとにテンプレートをマージし docs/ に出力する。
 * project-overrides.json のプロジェクト固有ディレクティブも適用する（後方互換）。
 *
 * Usage:
 *   node sdd-forge/engine/init.js [--type php-mvc] [--force]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadPackageField, loadJsonFile } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { callAgent, resolveAgent } from "../../lib/agent.js";
import { resolveChain, collectChapters, filterChapters } from "../lib/template-merger.js";
import { parseBlocks } from "../lib/directive-parser.js";
import { createLogger } from "../../lib/progress.js";

const logger = createLogger("init");

// ---------------------------------------------------------------------------
// project-overrides 適用（後方互換）
// ---------------------------------------------------------------------------

/**
 * project-overrides.json を読み込む。存在しなければ null を返す。
 */
function loadProjectOverrides(root) {
  const p = path.join(root, ".sdd-forge", "project-overrides.json");
  if (!fs.existsSync(p)) return null;
  console.warn("[init] WARN: project-overrides.json is deprecated. Use block inheritance (.sdd-forge/custom/) instead.");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * 見出しレベル（# の数）を返す。見出し行でなければ 0。
 */
function headingLevelOf(line) {
  const m = line.match(/^(#{1,6})\s/);
  return m ? m[1].length : 0;
}

/**
 * lines 配列から heading 文字列に一致する行のインデックスを返す。
 * 見つからなければ -1。
 */
function findHeading(lines, heading) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === heading) return i;
  }
  return -1;
}

/**
 * heading が占めるセクションの終了行（次の同レベル以上見出しの直前、
 * またはファイル末尾）のインデックスを返す。
 */
function sectionEnd(lines, headingIndex) {
  const level = headingLevelOf(lines[headingIndex]);
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const l = headingLevelOf(lines[i]);
    if (l > 0 && l <= level) return i;
  }
  return lines.length;
}

/**
 * replace-directive: 見出し配下の directiveIndex 番目の
 * <!-- @text: ... --> or <!-- @data: ... --> を置換する。
 */
function applyReplaceDirective(lines, action) {
  const hi = findHeading(lines, action.heading);
  if (hi === -1) {
    console.warn(`[init] WARN: heading not found: ${action.heading}`);
    return lines;
  }
  const end = sectionEnd(lines, hi);
  let count = 0;
  for (let i = hi + 1; i < end; i++) {
    if (/^\s*<!--\s*@(text|data)[\s\[:]+/.test(lines[i])) {
      if (count === action.directiveIndex) {
        lines[i] = action.replacement;
        return lines;
      }
      count++;
    }
  }
  console.warn(`[init] WARN: directive index ${action.directiveIndex} not found under ${action.heading}`);
  return lines;
}

/**
 * insert-after: heading セクション末尾（次の同レベル見出しの直前）に
 * content 行を挿入する。
 */
function applyInsertAfter(lines, action) {
  const hi = findHeading(lines, action.heading);
  if (hi === -1) {
    console.warn(`[init] WARN: heading not found: ${action.heading}`);
    return lines;
  }
  const end = sectionEnd(lines, hi);
  lines.splice(end, 0, ...action.content);
  return lines;
}

/**
 * insert-before: heading の直前に content 行を挿入する。
 */
function applyInsertBefore(lines, action) {
  const hi = findHeading(lines, action.heading);
  if (hi === -1) {
    console.warn(`[init] WARN: heading not found: ${action.heading}`);
    return lines;
  }
  lines.splice(hi, 0, ...action.content);
  return lines;
}

/**
 * アクション配列を逆順で適用する（挿入系の行番号ずれを防ぐため）。
 */
function applyOverrides(text, actions) {
  let lines = text.split("\n");
  // 逆順で適用（後方の挿入が前方のインデックスに影響しない）
  for (let i = actions.length - 1; i >= 0; i--) {
    const action = actions[i];
    switch (action.type) {
      case "replace-directive":
        lines = applyReplaceDirective(lines, action);
        break;
      case "insert-after":
        lines = applyInsertAfter(lines, action);
        break;
      case "insert-before":
        lines = applyInsertBefore(lines, action);
        break;
      default:
        console.warn(`[init] WARN: unknown action type: ${action.type}`);
    }
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// ブロックディレクティブ除去
// ---------------------------------------------------------------------------

/**
 * マージ済みテンプレートからブロック制御行を除去する。
 * docs/ 出力時にブロックディレクティブは不要。
 */
function stripBlockDirectives(text) {
  return text.split("\n")
    .filter((line) => {
      const t = line.trim();
      return !/^<!--\s*@(block:\s*[\w-]+|endblock|extends|parent)\s*-->$/.test(t);
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// AI 章選別
// ---------------------------------------------------------------------------

/**
 * analysis.json のサマリを構築する。
 */
function buildAnalysisSummary(analysis) {
  const lines = [];

  if (analysis.controllers?.summary) {
    const s = analysis.controllers.summary;
    lines.push(`Controllers: ${s.total} files`);
  }
  if (analysis.models?.summary) {
    const s = analysis.models.summary;
    lines.push(`Models: ${s.total} files (logic: ${s.logic || 0})`);
  }
  if (analysis.shells?.summary) {
    const s = analysis.shells.summary;
    lines.push(`Shells: ${s.total} files`);
  }
  if (analysis.routes?.summary) {
    const s = analysis.routes.summary;
    lines.push(`Routes: ${s.total} routes`);
  }
  if (analysis.extras) {
    const keys = Object.keys(analysis.extras);
    lines.push(`Extras: ${keys.join(", ")}`);
  }

  return lines.join("\n");
}

/**
 * AI エージェントで章の取捨選択を行う。
 *
 * @param {{ fileName: string, content: string }[]} chapters
 * @param {Object} analysis
 * @param {Object} agent - エージェント設定
 * @param {string} root
 * @returns {{ fileName: string, content: string }[]}
 */
function aiFilterChapters(chapters, analysis, agent, root) {
  const summary = buildAnalysisSummary(analysis);
  const chapterList = chapters.map((ch) => {
    // 章タイトル（最初の # 行）を抽出
    const titleMatch = ch.content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : ch.fileName;
    return `- ${ch.fileName}: ${title}`;
  }).join("\n");

  const prompt = [
    "You are selecting documentation chapters for a software project.",
    "Based on the source code analysis summary below, determine which chapters are relevant.",
    "",
    "## Analysis Summary",
    summary,
    "",
    "## Available Chapters",
    chapterList,
    "",
    "## Rules",
    "- Always include overview chapters (01_*, 02_*, 03_*, 04_*).",
    "- Exclude chapters whose topic has zero data in the analysis (e.g. no shells → exclude batch/shell chapter).",
    "- When in doubt, include the chapter.",
    "",
    "## Output Format",
    "Return ONLY a JSON array of filenames to include. No explanation, no markdown fences.",
    'Example: ["01_overview.md", "02_stack_and_ops.md"]',
  ].join("\n");

  let response;
  try {
    response = callAgent(agent, prompt, 60000, root);
  } catch (err) {
    console.warn(`[init] WARN: AI chapter selection failed: ${err.message}`);
    return chapters;
  }

  // JSON 配列をパース（コードフェンスがあれば除去）
  let cleaned = response.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
  }

  let selected;
  try {
    selected = JSON.parse(cleaned);
  } catch (_) {
    console.warn("[init] WARN: AI response is not valid JSON, skipping AI filter.");
    console.warn(`[init]   response: ${cleaned.slice(0, 200)}`);
    return chapters;
  }

  if (!Array.isArray(selected)) {
    console.warn("[init] WARN: AI response is not an array, skipping AI filter.");
    return chapters;
  }

  const selectedSet = new Set(selected);
  const filtered = chapters.filter((ch) => selectedSet.has(ch.fileName));

  if (filtered.length === 0) {
    console.warn("[init] WARN: AI selected 0 chapters, ignoring AI filter.");
    return chapters;
  }

  const removed = chapters.filter((ch) => !selectedSet.has(ch.fileName));
  if (removed.length > 0) {
    logger.verbose(`AI filter removed: ${removed.map((ch) => ch.fileName).join(", ")}`);
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// メイン処理
// ---------------------------------------------------------------------------
function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--force", "--dry-run"],
    options: ["--type"],
    defaults: { type: "", force: false, dryRun: false },
  });
  if (cli.help) {
    console.log([
      "Usage: node sdd-forge/engine/init.js [options]",
      "",
      "テンプレートを docs/ にコピーし、project-overrides を適用する。",
      "",
      "Options:",
      "  --type <type>            テンプレートタイプ (default: config.json type)",
      "  --force                  既存ファイルがある場合に上書き",
      "  --dry-run                ファイル書き込みせず対象ファイル一覧を表示",
      "  -h, --help               このヘルプを表示",
    ].join("\n"));
    return;
  }

  const root = repoRoot(import.meta.url);
  const defaults = loadPackageField(root, "docsInit") || {};
  const sddConfig = loadJsonFile(path.join(root, ".sdd-forge", "config.json"));

  const rawType = cli.type || sddConfig?.type || defaults.defaultType;
  if (!rawType) {
    logger.log("ERROR: type が設定されていません。.sdd-forge/config.json に \"type\" を設定するか --type オプションを指定してください。");
    process.exit(1);
  }

  const type = resolveType(rawType);
  const lang = sddConfig?.lang || "ja";

  if (type !== rawType) {
    logger.verbose(`type=${rawType} → ${type} (alias resolved) lang=${lang}`);
  } else {
    logger.verbose(`type=${type} lang=${lang}`);
  }

  // テンプレートルート
  const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const templatesRoot = path.join(pkgDir, "templates", "locale", lang);

  // 継承チェーンの構築
  let chain;
  try {
    chain = resolveChain(templatesRoot, type);
  } catch (err) {
    // 新しいテンプレート構造が存在しない場合、旧フラットディレクトリへフォールバック
    const legacyDir = path.join(templatesRoot, rawType);
    if (fs.existsSync(legacyDir)) {
      logger.verbose(`fallback to legacy template directory: ${rawType}`);
      return legacyInit(root, legacyDir, cli);
    }
    logger.log(`ERROR: ${err.message}`);
    process.exit(1);
  }

  // .sdd-forge/custom/ を継承チェーンに追加
  const customDir = path.join(root, ".sdd-forge", "custom");
  const hasCustom = fs.existsSync(customDir);
  if (hasCustom) {
    logger.verbose(".sdd-forge/custom/ found, adding to chain");
  }

  logger.verbose(`chain: ${chain.join(" → ")}${hasCustom ? " → .sdd-forge/custom" : ""}`);

  // テンプレートマージ
  // collectChapters は templatesRoot 内のディレクトリのみ走査するため、
  // custom ディレクトリは別途マージする
  const chapters = collectChapters(chain, templatesRoot);

  // .sdd-forge/custom/ のテンプレートを追加マージ
  if (hasCustom) {
    const customFiles = fs.readdirSync(customDir).filter((f) => /^\d{2}_.*\.md$/.test(f));
    for (const fileName of customFiles) {
      const customPath = path.join(customDir, fileName);
      const customContent = fs.readFileSync(customPath, "utf8");
      if (customContent.trim() === "") continue; // 空ファイルはスキップ

      const existing = chapters.find((ch) => ch.fileName === fileName);
      if (existing) {
        // 既存章にカスタムオーバーライドを適用
        const child = parseBlocks(customContent);
        if (child.extends) {
          // @extends あり → ブロックマージ
          const mergedLines = [];
          const parent = parseBlocks(existing.content);

          // preamble
          mergedLines.push(...parent.preamble);

          // blocks
          for (const [name, parentBlock] of parent.blocks) {
            const childBlock = child.blocks.get(name);
            mergedLines.push(`<!-- @block: ${name} -->`);
            if (!childBlock) {
              mergedLines.push(...parentBlock.content);
            } else if (childBlock.hasParent) {
              for (let i = 0; i < childBlock.content.length; i++) {
                if (i === childBlock.parentLine) {
                  mergedLines.push(...parentBlock.content);
                } else {
                  mergedLines.push(childBlock.content[i]);
                }
              }
            } else {
              mergedLines.push(...childBlock.content);
            }
            mergedLines.push("<!-- @endblock -->");
          }

          // child-only blocks
          for (const [name, childBlock] of child.blocks) {
            if (!parent.blocks.has(name)) {
              mergedLines.push(`<!-- @block: ${name} -->`);
              for (let i = 0; i < childBlock.content.length; i++) {
                if (i === childBlock.parentLine) continue;
                mergedLines.push(childBlock.content[i]);
              }
              mergedLines.push("<!-- @endblock -->");
            }
          }

          mergedLines.push(...parent.postamble);
          existing.content = mergedLines.join("\n");
        } else {
          // @extends なし → 完全置換
          existing.content = customContent;
        }
        logger.verbose(`custom override: ${fileName}`);
      } else {
        // 新規章
        chapters.push({ fileName, content: customContent });
        logger.verbose(`custom addition: ${fileName}`);
      }
    }
    // 再ソート
    chapters.sort((a, b) => a.fileName.localeCompare(b.fileName));
  }

  if (chapters.length === 0) {
    logger.log("ERROR: no template files found in chain");
    process.exit(1);
  }

  // analysis.json があれば決定的フィルタを適用
  const analysisPath = path.join(root, ".sdd-forge", "output", "analysis.json");
  let analysis = null;
  if (fs.existsSync(analysisPath)) {
    try {
      analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
      logger.verbose("analysis.json found, applying chapter filter");
    } catch (_) { /* ignore */ }
  }

  let filteredChapters = filterChapters(chapters, chain, templatesRoot, analysis);
  const deterministicFiltered = chapters.length - filteredChapters.length;

  // AI 章選別（analysis.json + agent が揃っている場合）
  if (analysis) {
    const agent = resolveAgent(sddConfig);
    if (agent) {
      logger.verbose("AI chapter selection...");
      filteredChapters = aiFilterChapters(filteredChapters, analysis, agent, root);
    }
  }

  const totalFiltered = chapters.length - filteredChapters.length;
  logger.verbose(`${filteredChapters.length} template files (${totalFiltered} filtered${totalFiltered > deterministicFiltered ? `, AI: ${totalFiltered - deterministicFiltered}` : ""})`);

  // project-overrides を読み込み（後方互換）
  const overridesData = loadProjectOverrides(root);
  const overrideMap = new Map();
  if (overridesData) {
    for (const entry of overridesData.overrides) {
      overrideMap.set(entry.file, entry.actions);
    }
    logger.verbose(`loaded project-overrides: ${overrideMap.size} file(s)`);
  }

  // docs/ ディレクトリの準備
  const docsDir = path.join(root, "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const fileNames = filteredChapters.map((ch) => ch.fileName);
  const conflicts = fileNames.filter((f) => fs.existsSync(path.join(docsDir, f)));

  if (conflicts.length > 0 && !cli.force) {
    logger.log(`ERROR: ${conflicts.length} file(s) already exist in docs/:`);
    for (const f of conflicts) {
      logger.log(`  - ${f}`);
    }
    logger.log("Use --force to overwrite.");
    process.exit(1);
  }

  if (conflicts.length > 0 && cli.force) {
    logger.verbose(`--force: overwriting ${conflicts.length} existing file(s)`);
  }

  // テンプレートを docs/ に出力
  for (const chapter of filteredChapters) {
    let text = chapter.content;

    // ブロックディレクティブを除去
    text = stripBlockDirectives(text);

    // project-overrides 適用（後方互換）
    const actions = overrideMap.get(chapter.fileName);
    if (actions) {
      text = applyOverrides(text, actions);
      logger.verbose(`merged + overrides applied: ${chapter.fileName} (${actions.length} action(s))`);
    } else {
      logger.verbose(`merged: ${chapter.fileName}`);
    }

    if (!cli.dryRun) {
      const dst = path.join(docsDir, chapter.fileName);
      fs.writeFileSync(dst, text, "utf8");
    }
  }

  if (cli.dryRun) {
    console.log(`DRY-RUN: ${filteredChapters.length} files would be initialized in docs/`);
  } else {
    logger.verbose(`done. ${filteredChapters.length} files initialized in docs/`);
  }
}

// ---------------------------------------------------------------------------
// レガシーフォールバック（旧フラットテンプレート構造）
// ---------------------------------------------------------------------------
function legacyInit(root, templateDir, cli) {
  const templateFiles = fs.readdirSync(templateDir)
    .filter((f) => /^\d{2}_.*\.md$/.test(f))
    .sort();

  if (templateFiles.length === 0) {
    logger.log(`ERROR: no template files found in ${templateDir}`);
    process.exit(1);
  }

  logger.verbose(`found ${templateFiles.length} template files (legacy mode)`);

  const overridesData = loadProjectOverrides(root);
  const overrideMap = new Map();
  if (overridesData) {
    for (const entry of overridesData.overrides) {
      overrideMap.set(entry.file, entry.actions);
    }
    logger.verbose(`loaded project-overrides: ${overrideMap.size} file(s)`);
  }

  const docsDir = path.join(root, "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const conflicts = templateFiles.filter((f) => fs.existsSync(path.join(docsDir, f)));

  if (conflicts.length > 0 && !cli.force) {
    logger.log(`ERROR: ${conflicts.length} file(s) already exist in docs/:`);
    for (const f of conflicts) {
      logger.log(`  - ${f}`);
    }
    logger.log("Use --force to overwrite.");
    process.exit(1);
  }

  if (conflicts.length > 0 && cli.force) {
    logger.verbose(`--force: overwriting ${conflicts.length} existing file(s)`);
  }

  for (const file of templateFiles) {
    const src = path.join(templateDir, file);
    const dst = path.join(docsDir, file);

    const actions = overrideMap.get(file);
    if (cli.dryRun) {
      console.log(`DRY-RUN: ${file}${actions ? ` (${actions.length} override(s))` : ""}`);
    } else if (actions) {
      const text = fs.readFileSync(src, "utf8");
      const result = applyOverrides(text, actions);
      fs.writeFileSync(dst, result, "utf8");
      logger.verbose(`copied + overrides applied: ${file} (${actions.length} action(s))`);
    } else {
      fs.copyFileSync(src, dst);
      logger.verbose(`copied: ${file}`);
    }
  }

  if (cli.dryRun) {
    console.log(`DRY-RUN: ${templateFiles.length} files would be initialized in docs/`);
  } else {
    logger.verbose(`done. ${templateFiles.length} files initialized in docs/`);
  }
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

#!/usr/bin/env node
/**
 * sdd-forge/engine/init.js
 *
 * テンプレートを docs/ にコピーし、project-overrides.json の
 * プロジェクト固有ディレクティブを適用する。
 *
 * Usage:
 *   node sdd-forge/engine/init.js [--type php-mvc] [--force]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot, parseArgs } from "../lib/cli.js";
import { loadPackageField, loadJsonFile } from "../lib/config.js";

// ---------------------------------------------------------------------------
// project-overrides 適用
// ---------------------------------------------------------------------------

/**
 * project-overrides.json を読み込む。存在しなければ null を返す。
 */
function loadProjectOverrides(root) {
  const p = path.join(root, ".sdd-forge", "project-overrides.json");
  if (!fs.existsSync(p)) return null;
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
 * <!-- @text-fill: ... --> or <!-- @data-fill: ... --> を置換する。
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
    if (/^\s*<!--\s*@(text-fill|data-fill):/.test(lines[i])) {
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
// メイン処理
// ---------------------------------------------------------------------------
function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--force"],
    options: ["--type"],
    defaults: { type: "", force: false },
  });
  if (cli.help) {
    console.log([
      "Usage: node sdd-forge/engine/init.js [options]",
      "",
      "テンプレートを docs/ にコピーし、project-overrides を適用する。",
      "",
      "Options:",
      "  --type <type>            テンプレートタイプ (default: package.json docsInit.defaultType)",
      "  --force                  既存ファイルがある場合に上書き",
      "  -h, --help               このヘルプを表示",
    ].join("\n"));
    return;
  }

  const root = repoRoot(import.meta.url);
  const defaults = loadPackageField(root, "docsInit") || {};
  const sddConfig = loadJsonFile(path.join(root, ".sdd-forge", "config.json"));

  const type = cli.type || sddConfig?.type || defaults.defaultType;
  if (!type) {
    console.error("[init] ERROR: type が設定されていません。.sdd-forge/config.json に \"type\" を設定するか --type オプションを指定してください。");
    process.exit(1);
  }
  const lang = sddConfig?.lang || "ja";

  console.log(`[init] type=${type} lang=${lang}`);

  // 1. テンプレートディレクトリの存在確認
  // npm パッケージ: テンプレートはパッケージ自身の templates/ に同梱される
  const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const templateDir = path.join(pkgDir, "templates", "locale", lang, type);
  if (!fs.existsSync(templateDir)) {
    console.error(`[init] ERROR: template directory not found: ${templateDir}`);
    process.exit(1);
  }

  // 2. テンプレートファイル一覧を取得
  const templateFiles = fs.readdirSync(templateDir)
    .filter((f) => /^\d{2}_.*\.md$/.test(f))
    .sort();

  if (templateFiles.length === 0) {
    console.error(`[init] ERROR: no template files found in ${templateDir}`);
    process.exit(1);
  }

  console.log(`[init] found ${templateFiles.length} template files`);

  // 3. project-overrides を読み込み
  const overridesData = loadProjectOverrides(root);
  const overrideMap = new Map();
  if (overridesData) {
    for (const entry of overridesData.overrides) {
      overrideMap.set(entry.file, entry.actions);
    }
    console.log(`[init] loaded project-overrides: ${overrideMap.size} file(s)`);
  }

  // 4. docs/ 内の既存ファイルとの衝突チェック
  const docsDir = path.join(root, "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const conflicts = templateFiles.filter((f) => fs.existsSync(path.join(docsDir, f)));

  if (conflicts.length > 0 && !cli.force) {
    console.error(`[init] ERROR: ${conflicts.length} file(s) already exist in docs/:`);
    for (const f of conflicts) {
      console.error(`  - ${f}`);
    }
    console.error("[init] Use --force to overwrite.");
    process.exit(1);
  }

  if (conflicts.length > 0 && cli.force) {
    console.log(`[init] --force: overwriting ${conflicts.length} existing file(s)`);
  }

  // 5. テンプレートを docs/ にコピー（overrides があれば適用）
  for (const file of templateFiles) {
    const src = path.join(templateDir, file);
    const dst = path.join(docsDir, file);

    const actions = overrideMap.get(file);
    if (actions) {
      const text = fs.readFileSync(src, "utf8");
      const result = applyOverrides(text, actions);
      fs.writeFileSync(dst, result, "utf8");
      console.log(`[init] copied + overrides applied: ${file} (${actions.length} action(s))`);
    } else {
      fs.copyFileSync(src, dst);
      console.log(`[init] copied: ${file}`);
    }
  }

  console.log(`[init] done. ${templateFiles.length} files initialized in docs/`);
}

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

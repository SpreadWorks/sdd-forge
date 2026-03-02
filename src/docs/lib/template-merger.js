/**
 * sdd-forge/engine/template-merger.js
 *
 * テンプレート継承エンジン。
 * ディレクトリ階層をもとに base → leaf の継承チェーンを構築し、
 * @block / @endblock / @extends / @parent ディレクティブでブロック単位のマージを行う。
 */

import fs from "fs";
import path from "path";
import { parseBlocks } from "./directive-parser.js";

// ---------------------------------------------------------------------------
// 継承チェーン解決
// ---------------------------------------------------------------------------

/**
 * type パス（例: "webapp/cakephp2"）を継承チェーンに展開する。
 * 各セグメントが templates ディレクトリに存在することを検証する。
 *
 * @param {string} templatesRoot - テンプレートルート（例: .../locale/ja/）
 * @param {string} typePath - 型パス（例: "webapp/cakephp2"）
 * @returns {string[]} 継承チェーン（例: ["base", "webapp", "webapp/cakephp2"]）
 */
export function resolveChain(templatesRoot, typePath) {
  const segments = typePath.split("/").filter(Boolean);
  const chain = ["base"];

  let accumulated = "";
  for (const seg of segments) {
    accumulated = accumulated ? accumulated + "/" + seg : seg;
    if (accumulated !== "base") {
      chain.push(accumulated);
    }
  }

  // ディレクトリ存在検証
  for (const entry of chain) {
    const dir = path.join(templatesRoot, entry);
    if (!fs.existsSync(dir)) {
      throw new Error(`Template directory not found: ${dir}`);
    }
  }

  return chain;
}

// ---------------------------------------------------------------------------
// ブロックマージ
// ---------------------------------------------------------------------------

/**
 * 親テンプレートと子テンプレートをブロック単位でマージする。
 *
 * @param {string} parentText - 親テンプレートの全文
 * @param {string} childText - 子テンプレートの全文
 * @returns {string} マージ結果
 */
function mergeTexts(parentText, childText) {
  const parent = parseBlocks(parentText);
  const child = parseBlocks(childText);

  // 子が @extends を持たない → 完全置換
  if (!child.extends) {
    return childText;
  }

  // 子が @extends を持つ → ブロック単位で親をマージ
  const resultLines = [];

  // preamble: 親を使用（子のpreambleは @extends 行のみのことが多い）
  resultLines.push(...parent.preamble);

  // ブロック: 親のブロック順に走査し、子のオーバーライドを適用
  for (const [name, parentBlock] of parent.blocks) {
    const childBlock = child.blocks.get(name);

    resultLines.push(`<!-- @block: ${name} -->`);

    if (!childBlock) {
      // 子にブロックなし → 親をそのまま使用
      resultLines.push(...parentBlock.content);
    } else if (childBlock.hasParent) {
      // 子に @parent がある → 親の内容を @parent 位置に挿入
      for (let i = 0; i < childBlock.content.length; i++) {
        if (i === childBlock.parentLine) {
          // @parent の位置に親の内容を展開
          resultLines.push(...parentBlock.content);
        } else {
          resultLines.push(childBlock.content[i]);
        }
      }
    } else {
      // 子にブロックあるが @parent なし → 子で完全置換
      resultLines.push(...childBlock.content);
    }

    resultLines.push("<!-- @endblock -->");
  }

  // 子にのみ存在するブロック（親にないもの）を追加
  for (const [name, childBlock] of child.blocks) {
    if (!parent.blocks.has(name)) {
      resultLines.push(`<!-- @block: ${name} -->`);
      // @parent があっても親ブロックがないので無視（子の内容のみ）
      for (let i = 0; i < childBlock.content.length; i++) {
        if (i === childBlock.parentLine) continue; // @parent をスキップ
        resultLines.push(childBlock.content[i]);
      }
      resultLines.push("<!-- @endblock -->");
    }
  }

  // postamble: 親を使用
  resultLines.push(...parent.postamble);

  return resultLines.join("\n");
}

// ---------------------------------------------------------------------------
// ファイルマージ
// ---------------------------------------------------------------------------

/**
 * 継承チェーンに沿ってテンプレートファイルをマージする。
 *
 * @param {string} fileName - テンプレートファイル名（例: "01_overview.md"）
 * @param {string[]} chain - 継承チェーン（例: ["base", "webapp", "webapp/cakephp2"]）
 * @param {string} templatesRoot - テンプレートルート
 * @returns {string|null} マージ結果。空ファイルの場合は null（削除マーク）。
 */
export function mergeFile(fileName, chain, templatesRoot) {
  let result = null;

  for (const entry of chain) {
    const filePath = path.join(templatesRoot, entry, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");

    // 空ファイル → 削除マーク
    if (content.trim() === "") {
      return null;
    }

    if (result === null) {
      // 最初のファイル → ベース
      result = content;
    } else {
      // 後続 → マージ
      result = mergeTexts(result, content);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// 章収集
// ---------------------------------------------------------------------------

/**
 * 継承チェーン全体から章ファイル名を収集・マージし、
 * ソート済みリストを返す。
 * 空ファイル（削除マーク）はスキップ。
 *
 * @param {string[]} chain - 継承チェーン
 * @param {string} templatesRoot - テンプレートルート
 * @returns {{ fileName: string, content: string }[]}
 */
export function collectChapters(chain, templatesRoot) {
  // 全チェーンから章ファイル名を収集
  const allFiles = new Set();
  for (const entry of chain) {
    const dir = path.join(templatesRoot, entry);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => /^\d{2}_.*\.md$/.test(f));
    for (const f of files) allFiles.add(f);
  }

  // ソートしてマージ
  const sorted = [...allFiles].sort();
  const chapters = [];

  for (const fileName of sorted) {
    const content = mergeFile(fileName, chain, templatesRoot);
    if (content !== null) {
      chapters.push({ fileName, content });
    }
  }

  return chapters;
}

/**
 * 継承チェーンから README.md テンプレートを解決する。
 * 最も具体的な（リーフに近い）README.md を使用する。
 *
 * @param {string[]} chain - 継承チェーン
 * @param {string} templatesRoot - テンプレートルート
 * @returns {string|null} README テンプレートパス、見つからなければ null
 */
export function resolveReadmeTemplate(chain, templatesRoot) {
  // リーフから順に探索
  for (let i = chain.length - 1; i >= 0; i--) {
    const p = path.join(templatesRoot, chain[i], "README.md");
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ---------------------------------------------------------------------------
// chapters.json ベースのフィルタリング (Phase 3 準備)
// ---------------------------------------------------------------------------

/**
 * 決定的フィルタ: chapters.json の requires 条件で章をフィルタする。
 * analysis.json の該当セクションが空 or 存在しない → スキップ。
 *
 * @param {{ fileName: string, content: string }[]} chapters
 * @param {string[]} chain - 継承チェーン
 * @param {string} templatesRoot
 * @param {Object|null} analysis - analysis.json（null なら全章を含める）
 * @returns {{ fileName: string, content: string }[]}
 */
export function filterChapters(chapters, chain, templatesRoot, analysis) {
  if (!analysis) return chapters;

  // 全チェーンの chapters.json をマージ（後勝ち）
  const requirements = {};
  for (const entry of chain) {
    const chaptersJsonPath = path.join(templatesRoot, entry, "chapters.json");
    if (!fs.existsSync(chaptersJsonPath)) continue;
    const data = JSON.parse(fs.readFileSync(chaptersJsonPath, "utf8"));
    Object.assign(requirements, data);
  }

  if (Object.keys(requirements).length === 0) return chapters;

  return chapters.filter((ch) => {
    const req = requirements[ch.fileName];
    if (!req || !Array.isArray(req.requires)) return true;

    // requires の全条件を満たすか
    return req.requires.every((key) => {
      const section = analysis[key];
      if (!section) return false;
      // 配列の場合は長さチェック
      if (Array.isArray(section)) return section.length > 0;
      // オブジェクトの場合はメインリストをチェック
      if (section[key] && Array.isArray(section[key])) return section[key].length > 0;
      // summary のチェック
      if (section.summary && section.summary.total !== undefined) return section.summary.total > 0;
      return true;
    });
  });
}

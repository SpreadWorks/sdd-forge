/**
 * sdd-forge/docs/lib/review-parser.js
 *
 * Review output parsing and deterministic patching for the forge command.
 */

import fs from "fs";
import path from "path";
import { readText } from "./command-context.js";

export const FALLBACK_PATCH_ORDER = Object.freeze([
  "controllers",
  "tables",
  "headings",
  "sections",
]);

export function extractNeedsInput(out) {
  const text = String(out || "");
  const idx = text.indexOf("NEEDS_INPUT");
  if (idx < 0) return [];
  const tail = text.slice(idx).split("\n");
  const qs = [];
  for (const line of tail.slice(1)) {
    const s = line.trim();
    if (s.startsWith("- ")) {
      qs.push(s.slice(2).trim());
      continue;
    }
    if (s.length === 0) continue;
    break;
  }
  return qs.filter(Boolean);
}

export function summarizeReview(outputText) {
  const lines = String(outputText || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const fails = lines.filter((l) => l.includes("[FAIL]"));
  const warns = lines.filter((l) => l.includes("[WARN]"));
  const coverage = lines.filter(
    (l) =>
      l.includes("Controller coverage:") ||
      l.includes("DB table coverage:") ||
      l.includes("quality check:")
  );
  const picked = [...fails.slice(0, 40), ...warns.slice(0, 10), ...coverage].join("\n");
  return picked || "(no parsed failures)";
}

export function parseReviewMisses(outputText) {
  const controllers = [];
  const tables = [];
  const headings = [];
  const sections = [];
  const lines = String(outputText || "").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    const ctrl = line.match(/^\[MISS\]\s+([A-Za-z0-9_]+)$/);
    if (ctrl?.[1]) {
      controllers.push(ctrl[1]);
      continue;
    }
    const table = line.match(/^\[MISS\]\s+table\s+([a-zA-Z0-9_]+)/);
    if (table?.[1]) {
      tables.push(table[1]);
      continue;
    }
    const heading = line.match(/^\[FAIL\]\s+missing heading:\s+(.+)/i);
    if (heading?.[1]) {
      headings.push(heading[1].trim());
      continue;
    }
    const section = line.match(/^\[FAIL\]\s+missing section:\s+(.+)/i);
    if (section?.[1]) {
      sections.push(section[1].trim());
    }
  }
  const sortUniq = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b));
  return {
    controllers: sortUniq(controllers),
    tables: sortUniq(tables),
    headings: sortUniq(headings),
    sections: sortUniq(sections),
  };
}

export function ensureSection(text, heading) {
  if (text.includes(heading)) return text;
  return `${text.trimEnd()}\n\n${heading}\n\n`;
}

export function patchGeneratedForMisses(root, misses, analysisData) {
  let changed = false;
  const touched = [];

  const hasControllerData = !!analysisData?.controllers;
  const hasModelData = !!analysisData?.models;

  if (misses.controllers.length > 0 && !hasControllerData) {
    const p = path.join(root, "docs/08_controller_routes.md");
    let s = readText(p);
    if (s) {
      s = ensureSection(s, "### 未整理コントローラ（自動補完）");
      for (const ctrl of misses.controllers) {
        if (!s.includes(ctrl)) {
          s += `- \`${ctrl}Controller\`\n`;
          changed = true;
        }
      }
      fs.writeFileSync(p, s.endsWith("\n") ? s : `${s}\n`);
      touched.push(path.relative(root, p));
    }
  }

  if (misses.tables.length > 0 && !hasModelData) {
    const p = path.join(root, "docs/07_db_tables.md");
    let s = readText(p);
    if (s) {
      s = ensureSection(s, "### 未整理テーブル（自動補完）");
      for (const t of misses.tables) {
        if (!s.includes(t)) {
          s += `- \`${t}\`\n`;
          changed = true;
        }
      }
      fs.writeFileSync(p, s.endsWith("\n") ? s : `${s}\n`);
      touched.push(path.relative(root, p));
    }
  }

  if (misses.headings.length > 0 || misses.sections.length > 0) {
    const p = path.join(root, "docs/04_development.md");
    let s = readText(p);
    if (s) {
      if (misses.sections.length > 0) {
        s = ensureSection(s, "### 未整理項目（自動補完）");
        for (const section of misses.sections) {
          const bullet = `- ${section}`;
          if (!s.includes(bullet)) {
            s += `${bullet}\n`;
            changed = true;
          }
        }
      }
      if (misses.headings.length > 0) {
        s = ensureSection(s, "### 未整理見出し（自動補完）");
        for (const heading of misses.headings) {
          const bullet = `- ${heading}`;
          if (!s.includes(bullet)) {
            s += `${bullet}\n`;
            changed = true;
          }
        }
      }
      fs.writeFileSync(p, s.endsWith("\n") ? s : `${s}\n`);
      touched.push(path.relative(root, p));
    }
  }

  return { changed, touched };
}

/**
 * review 出力からファイル単位の PASS/FAIL 情報を抽出する。
 * [FAIL] 行に含まれるファイル名を failedFiles、
 * review 対象のうち failedFiles に含まれないものを passedFiles として返す。
 *
 * @param {string} outputText - review コマンドの stdout+stderr
 * @param {string[]} allFiles - review 対象の全ファイル名リスト (例: ["docs/01_overview.md", ...])
 * @returns {{ passedFiles: string[], failedFiles: string[] }}
 */
export function parseFileResults(outputText, allFiles) {
  const text = String(outputText || "");
  const failedSet = new Set();

  // [FAIL] / [WARN] 行からファイル名を抽出
  // 形式例: "[FAIL] 行数不足 (5 行): overview.md"
  //         "[FAIL] HTML コメント外に露出したディレクティブ 1 件: cli_commands.md"
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes("[FAIL]")) continue;
    // ファイル名は行末にある（": filename" パターン）
    const match = trimmed.match(/:\s*([\w/.-]+\.md)\s*$/);
    if (match) {
      const fileName = match[1];
      for (const f of allFiles) {
        if (f === fileName || f.endsWith(`/${fileName}`) || fileName.endsWith(`/${f}`)) {
          failedSet.add(f);
        } else {
          const fBase = f.split("/").pop();
          if (fBase === path.basename(fileName)) {
            failedSet.add(f);
          }
        }
      }
    }
  }

  const failedFiles = [...failedSet];
  const passedFiles = allFiles.filter((f) => !failedSet.has(f));
  return { passedFiles, failedFiles };
}

export function summarizeNeedsInput(reviewOut) {
  const lines = reviewOut
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.startsWith("[FAIL]") || x.startsWith("[MISS]"));
  const uniq = [...new Set(lines)];
  return uniq.slice(0, 8);
}

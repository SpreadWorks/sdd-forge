/**
 * Next.js コンポーネント解析器。
 * app/, components/, src/components/, src/app/ 配下の .tsx/.jsx ファイルをスキャンし、
 * server / client / shared に分類する。
 */

import fs from "fs";
import path from "path";
import { collectFiles } from "../../../docs/lib/scanner.js";

const INCLUDE = [
  "app/**/*.tsx", "app/**/*.jsx",
  "components/**/*.tsx", "components/**/*.jsx",
  "src/components/**/*.tsx", "src/components/**/*.jsx",
  "src/app/**/*.tsx", "src/app/**/*.jsx",
];

/**
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {{ components: Object[], summary: { total: number, server: number, client: number, shared: number } }}
 */
export function analyzeComponents(sourceRoot) {
  const files = collectFiles(sourceRoot, INCLUDE);
  const components = [];

  for (const f of files) {
    const content = fs.readFileSync(f.absPath, "utf8");
    const type = classifyComponent(f.relPath, content);
    components.push({
      name: path.basename(f.fileName, path.extname(f.fileName)),
      file: f.relPath,
      relPath: f.relPath,
      type,
      lines: f.lines,
      hash: f.hash,
      mtime: f.mtime,
    });
  }

  const byType = { server: 0, client: 0, shared: 0 };
  for (const c of components) byType[c.type]++;

  return {
    components,
    summary: { total: components.length, ...byType },
  };
}

function classifyComponent(relPath, content) {
  if (/\/(shared|common)\//.test(relPath)) return "shared";
  if (/^["']use client["']/.test(content.trimStart())) return "client";
  return "server";
}

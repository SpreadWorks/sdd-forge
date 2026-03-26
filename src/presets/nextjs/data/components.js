/**
 * NextjsComponentsSource — scan + data DataSource for Next.js components.
 *
 * Scans .tsx/.jsx files in app/components directories and classifies them
 * as server, client, or shared components.
 * Data methods read analysis.components to generate component tables.
 */

import fs from "fs";
import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { collectFiles } from "../../../docs/lib/scanner.js";

const COMPONENT_DIRS = /^(app|components|src\/components|src\/app)\//;
const COMPONENT_EXT = /\.(tsx|jsx)$/;

function classifyComponent(absPath, content) {
  if (/\/(shared|common)\//.test(absPath)) return "shared";
  if (/^["']use client["']/.test(content.trimStart())) return "client";
  return "server";
}

export class ComponentEntry extends AnalysisEntry {
  name = null;
  componentType = null;

  static summary = {};
}

export default class NextjsComponentsSource extends Scannable(DataSource) {
  static Entry = ComponentEntry;

  match(relPath) {
    return COMPONENT_EXT.test(relPath) && COMPONENT_DIRS.test(relPath);
  }

  parse(absPath) {
    const entry = new ComponentEntry();
    const content = fs.readFileSync(absPath, "utf8");
    entry.name = path.basename(absPath, path.extname(absPath));
    entry.componentType = classifyComponent(absPath, content);
    return entry;
  }

  /** Server Components table. */
  server(analysis, labels) {
    const items = (analysis.components?.entries || []).filter(
      (c) => c.componentType === "server",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "\u2014",
      c.file || "\u2014",
      c.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Component", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Client Components table. */
  client(analysis, labels) {
    const items = (analysis.components?.entries || []).filter(
      (c) => c.componentType === "client",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "\u2014",
      c.file || "\u2014",
      c.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Component", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Shared/UI Components table. */
  shared(analysis, labels) {
    const items = (analysis.components?.entries || []).filter(
      (c) => c.componentType === "shared",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "\u2014",
      c.file || "\u2014",
      c.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Component", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzer (moved from scan/components.js, used by tests)
// ---------------------------------------------------------------------------

const INCLUDE = [
  "app/**/*.tsx", "app/**/*.jsx",
  "components/**/*.tsx", "components/**/*.jsx",
  "src/components/**/*.tsx", "src/components/**/*.jsx",
  "src/app/**/*.tsx", "src/app/**/*.jsx",
];

function classifyComponentDir(relPath, content) {
  if (/\/(shared|common)\//.test(relPath)) return "shared";
  if (/^["']use client["']/.test(content.trimStart())) return "client";
  return "server";
}

/**
 * @param {string} sourceRoot
 * @returns {{ components: Object[], summary: { total: number, server: number, client: number, shared: number } }}
 */
export function analyzeComponents(sourceRoot) {
  const files = collectFiles(sourceRoot, INCLUDE);
  const components = [];

  for (const f of files) {
    const content = fs.readFileSync(f.absPath, "utf8");
    const type = classifyComponentDir(f.relPath, content);
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

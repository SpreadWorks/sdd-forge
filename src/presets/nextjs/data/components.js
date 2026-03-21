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

const COMPONENT_DIRS = /^(app|components|src\/components|src\/app)\//;
const COMPONENT_EXT = /\.(tsx|jsx)$/;

function toPascalCase(fileName) {
  return path.basename(fileName, path.extname(fileName));
}

function classifyComponent(relPath, content) {
  if (/\/(shared|common)\//.test(relPath)) return "shared";
  if (/^["']use client["']/.test(content.trimStart())) return "client";
  return "server";
}

function filterByType(analysis, type) {
  const items = analysis.components?.components;
  if (!Array.isArray(items)) return [];
  return items.filter((c) => c.type === type);
}

export default class NextjsComponentsSource extends Scannable(DataSource) {
  match(file) {
    return COMPONENT_EXT.test(file.relPath) && COMPONENT_DIRS.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;

    const components = [];
    for (const f of files) {
      const content = fs.readFileSync(f.absPath, "utf8");
      const type = classifyComponent(f.relPath, content);
      components.push({
        name: toPascalCase(f.fileName),
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

  /** Server Components table. */
  server(analysis, labels) {
    const items = filterByType(analysis, "server");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "\u2014",
      c.relPath || "\u2014",
      c.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Component", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Client Components table. */
  client(analysis, labels) {
    const items = filterByType(analysis, "client");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "\u2014",
      c.relPath || "\u2014",
      c.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Component", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Shared/UI Components table. */
  shared(analysis, labels) {
    const items = filterByType(analysis, "shared");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "\u2014",
      c.relPath || "\u2014",
      c.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Component", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

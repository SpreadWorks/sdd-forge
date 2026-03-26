/**
 * HonoMiddlewareSource — scan + data DataSource for Hono middleware.
 *
 * Scans .ts/.js/.mjs files for app.use() calls and createMiddleware()
 * definitions to extract middleware registrations.
 * Data methods read analysis.middleware to generate middleware tables.
 */

import fs from "fs";
import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { collectFiles } from "../../../docs/lib/scanner.js";

const SOURCE_EXT = /\.(ts|js|mjs)$/;

export class MiddlewareEntry extends AnalysisEntry {
  name = null;
  middlewarePath = null;

  static summary = {};
}

export default class HonoMiddlewareSource extends WebappDataSource {
  static Entry = MiddlewareEntry;

  match(relPath) {
    return SOURCE_EXT.test(relPath);
  }

  parse(absPath) {
    const entry = new MiddlewareEntry();
    const content = fs.readFileSync(absPath, "utf8");

    // Pattern 1: .use('/path', middlewareName( ... ))
    const useWithPathRegex = /\.use\(\s*['"]([^'"]*)['"]\s*,\s*(\w+)\s*\(/;
    const m1 = useWithPathRegex.exec(content);
    if (m1) {
      entry.name = m1[2];
      entry.middlewarePath = m1[1];
      return entry;
    }

    // Pattern 2: .use(middlewareName( ... )) — no path argument
    const useNoPathRegex = /\.use\(\s*(\w+)\s*\(/;
    const m2 = useNoPathRegex.exec(content);
    if (m2) {
      entry.name = m2[1];
      entry.middlewarePath = "*";
      return entry;
    }

    // Pattern 3: createMiddleware() definitions
    const createMwRegex = /(?:const|let|var)\s+(\w+)\s*=\s*createMiddleware\s*\(/;
    const m3 = createMwRegex.exec(content);
    if (m3) {
      entry.name = m3[1];
      entry.middlewarePath = "*";
      return entry;
    }

    return entry;
  }

  /** Middleware list table. */
  list(analysis, labels) {
    const items = analysis.middleware?.entries || [];
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.name || "\u2014",
      m.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Middleware", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzer (moved from scan/middleware.js, used by tests)
// ---------------------------------------------------------------------------

const SOURCE_INCLUDE = ["**/*.ts", "**/*.js", "**/*.mjs"];
const SOURCE_EXCLUDE = ["node_modules/**", "dist/**", "build/**"];

/**
 * Scan sourceRoot for Hono middleware usage.
 *
 * @param {string} sourceRoot - absolute path to the project root
 * @returns {{ middleware: Object[], summary: { total: number } }}
 */
export function analyzeMiddleware(sourceRoot) {
  const files = collectFiles(sourceRoot, SOURCE_INCLUDE, SOURCE_EXCLUDE);
  const middleware = [];
  const seen = new Set();

  for (const f of files) {
    const content = fs.readFileSync(f.absPath, "utf8");
    const stats = { file: f.relPath, hash: f.hash, mtime: f.mtime };

    // Pattern 1: .use('/path', middlewareName( ... ))
    const useWithPathRegex = /\.use\(\s*['"]([^'"]*)['"]\s*,\s*(\w+)\s*\(/g;
    let m;
    while ((m = useWithPathRegex.exec(content)) !== null) {
      const mwPath = m[1];
      const name = m[2];
      const key = `${name}:${mwPath}`;
      if (seen.has(key)) continue;
      seen.add(key);
      middleware.push({ name, path: mwPath, ...stats });
    }

    // Pattern 2: .use(middlewareName( ... )) — no path argument
    const useNoPathRegex = /\.use\(\s*(\w+)\s*\(/g;
    while ((m = useNoPathRegex.exec(content)) !== null) {
      const name = m[1];
      const key = `${name}:*`;
      if (seen.has(key)) continue;
      seen.add(key);
      middleware.push({ name, path: "*", ...stats });
    }

    // Pattern 3: createMiddleware() definitions
    const createMwRegex =
      /(?:const|let|var)\s+(\w+)\s*=\s*createMiddleware\s*\(/g;
    while ((m = createMwRegex.exec(content)) !== null) {
      const name = m[1];
      const key = `custom:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      middleware.push({ name, path: "*", ...stats });
    }
  }

  return {
    middleware,
    summary: { total: middleware.length },
  };
}

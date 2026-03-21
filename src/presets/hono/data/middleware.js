/**
 * HonoMiddlewareSource — scan + data DataSource for Hono middleware.
 *
 * Scans source files for app.use() calls to extract middleware registrations.
 * Data methods read analysis.middleware to generate middleware tables.
 */

import fs from "fs";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";

const SOURCE_EXT = /\.(ts|js|mjs)$/;

export default class HonoMiddlewareSource extends Scannable(DataSource) {
  match(file) {
    return SOURCE_EXT.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;

    const middleware = [];
    const seen = new Set();

    for (const f of files) {
      const content = fs.readFileSync(f.absPath, "utf8");

      // Match app.use("path", middleware) or app.use(middleware)
      const useRegex = /\.use\(\s*(?:['"]([^'"]*)['"]\s*,\s*)?(\w+)\s*\(/g;
      let m;
      while ((m = useRegex.exec(content)) !== null) {
        const mwPath = m[1] || "*";
        const name = m[2];
        const key = `${name}:${mwPath}`;
        if (seen.has(key)) continue;
        seen.add(key);
        middleware.push({
          name,
          path: mwPath,
          file: f.relPath,
          hash: f.hash,
          mtime: f.mtime,
        });
      }

      // Match direct middleware function calls: app.use(middlewareFn())
      // with no path — simpler pattern for built-in Hono middleware
      const simpleUseRegex = /\.use\(\s*(\w+)\s*\(\s*\{?/g;
      while ((m = simpleUseRegex.exec(content)) !== null) {
        const name = m[1];
        const key = `${name}:*`;
        if (seen.has(key)) continue;
        seen.add(key);
        middleware.push({
          name,
          path: "*",
          file: f.relPath,
          hash: f.hash,
          mtime: f.mtime,
        });
      }
    }

    if (middleware.length === 0) return null;

    return {
      middleware,
      summary: { total: middleware.length },
    };
  }

  /** Middleware list table. */
  list(analysis, labels) {
    const items = analysis.middleware?.middleware;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.name || "\u2014",
      m.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Middleware", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

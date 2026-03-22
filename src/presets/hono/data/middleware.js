/**
 * HonoMiddlewareSource — scan + data DataSource for Hono middleware.
 *
 * Delegates scanning to scan/middleware.js analyzeMiddleware().
 * Data methods read analysis.middleware to generate middleware tables.
 */

import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { analyzeMiddleware } from "../scan/middleware.js";

const SOURCE_EXT = /\.(ts|js|mjs)$/;

export default class HonoMiddlewareSource extends WebappDataSource {
  match(file) {
    return SOURCE_EXT.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = this.deriveSourceRoot(files);
    const result = analyzeMiddleware(sourceRoot);
    if (result.middleware.length === 0) return null;
    return result;
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

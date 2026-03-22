/**
 * Hono middleware analyzer.
 *
 * Scans .ts / .js / .mjs files for app.use() calls and createMiddleware()
 * definitions to extract middleware registrations.
 */

import fs from "fs";
import path from "path";
import { collectFiles, getFileStats } from "../../../docs/lib/scanner.js";

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

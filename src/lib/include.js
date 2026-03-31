/**
 * src/lib/include.js
 *
 * Resolve `<!-- include("path") -->` directives in template content.
 * Replaces each directive line with the referenced file's content.
 * Supports recursive resolution (includes within includes).
 */

import fs from "fs";
import path from "path";

const INCLUDE_RE = /^<!--\s*include\("([^"]+)"\)\s*-->$/;

/**
 * Resolve a single include path to an absolute file path.
 *
 * Resolution rules:
 * - `name`              → baseDir (same folder)
 * - `/path/to/name`     → pkgDir (src/) root
 * - `@templates/path`   → templatesDir
 * - `@presets/<p>/path` → presetsDir/<p>/path
 *
 * @param {string} includePath - path from the include directive
 * @param {Object} opts
 * @param {string} opts.baseDir - directory of the file containing the include
 * @param {string} [opts.pkgDir] - PKG_DIR (src/) for absolute paths
 * @param {string} [opts.templatesDir] - templates root for @templates/
 * @param {string} [opts.presetsDir] - presets root for @presets/
 * @returns {string} absolute file path
 */
function resolveIncludePath(includePath, opts) {
  if (includePath.includes("../")) {
    throw new Error(`Forbidden path: "${includePath}" contains "../"`);
  }
  if (includePath.includes("./")) {
    throw new Error(`Forbidden path: "${includePath}" contains "./"`);
  }

  if (includePath.startsWith("@templates/")) {
    const rel = includePath.slice("@templates/".length);
    if (!opts.templatesDir) throw new Error(`Cannot resolve "${includePath}": templatesDir not provided`);
    return path.join(opts.templatesDir, rel);
  }

  if (includePath.startsWith("@presets/")) {
    const rel = includePath.slice("@presets/".length);
    if (!opts.presetsDir) throw new Error(`Cannot resolve "${includePath}": presetsDir not provided`);
    return path.join(opts.presetsDir, rel);
  }

  if (includePath.startsWith("/")) {
    const rel = includePath.slice(1);
    const pkgDir = opts.pkgDir || opts.baseDir;
    return path.join(pkgDir, rel);
  }

  return path.join(opts.baseDir, includePath);
}

/**
 * Resolve all include directives in content.
 *
 * @param {string} content - template content with include directives
 * @param {Object} opts
 * @param {string} opts.baseDir - directory of the source file
 * @param {string} [opts.pkgDir] - PKG_DIR for / paths
 * @param {string} [opts.templatesDir] - templates root for @templates/
 * @param {string} [opts.presetsDir] - presets root for @presets/
 * @param {string} [opts.lang] - language for fallback resolution
 * @param {string} [opts.sourceFile] - source file name (for error messages)
 * @param {Set<string>} [opts._seen] - internal: tracks visited files for circular detection
 * @returns {string} content with all includes resolved
 */
export function resolveIncludes(content, opts) {
  const seen = opts._seen || new Set();
  const lines = content.split("\n");
  const result = [];

  for (const line of lines) {
    const match = line.trim().match(INCLUDE_RE);
    if (!match) {
      result.push(line);
      continue;
    }

    const includePath = match[1];
    const resolved = resolveIncludePath(includePath, opts);

    if (!fs.existsSync(resolved)) {
      const src = opts.sourceFile || opts.baseDir;
      throw new Error(`Include not found: "${includePath}" (resolved to "${resolved}") in ${src}`);
    }

    if (seen.has(resolved)) {
      throw new Error(`Circular include detected: "${includePath}" (${resolved})`);
    }

    seen.add(resolved);
    const included = fs.readFileSync(resolved, "utf8");

    // Recursively resolve includes in the included content
    const expanded = resolveIncludes(included, {
      ...opts,
      baseDir: path.dirname(resolved),
      sourceFile: resolved,
      _seen: seen,
    });

    result.push(expanded.replace(/\n$/, ""));
  }

  return result.join("\n");
}

/**
 * Source code minifier.
 * Uses lang-factory to dispatch to language-specific minifiers.
 * Generic utilities (blank line removal, trailing whitespace) are applied first.
 */

import { getLangHandler } from "./lang-factory.js";

function removeBlankLines(code) {
  return code
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n");
}

function removeTrailingWhitespace(code) {
  return code
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

/**
 * Extract essential lines: import, export, return, throw, major API calls.
 * Produces a minimal representation suitable for AI summarization.
 */
function extractEssential(code) {
  const lines = code.split("\n");
  const kept = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^import\s/.test(t)) { kept.push(t); continue; }
    if (/^export\s/.test(t)) { kept.push(t); continue; }
    if (/^(const|let|var)\s+[A-Z_]+\s*=/.test(t)) { kept.push(t); continue; }
    if (/^(async\s+)?function\s/.test(t)) { kept.push(t); continue; }
    if (/^class\s/.test(t)) { kept.push(t); continue; }
    if (/^\s*return\s/.test(line)) { kept.push(t); continue; }
    if (/^\s*throw\s/.test(line)) { kept.push(t); continue; }
    if (/^\s*(await\s|new\s)/.test(line)) { kept.push(t); continue; }
    if (/\b(fs\.|path\.|JSON\.|process\.|child_process)/.test(t) && !/^\/\//.test(t)) { kept.push(t); continue; }
  }
  return kept.join("\n");
}

export function minify(code, filePath, opts) {
  if (!code) return code;

  if (opts?.mode === "essential") {
    return extractEssential(code);
  }

  let result = removeBlankLines(code);
  result = removeTrailingWhitespace(result);

  const handler = getLangHandler(filePath);
  if (handler?.minify) {
    result = handler.minify(result);
  }

  // Final cleanup: remove blank lines introduced by comment removal
  result = removeBlankLines(result);

  return result;
}

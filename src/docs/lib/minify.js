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
    // JS/TS patterns
    if (/^import\s/.test(t)) { kept.push(t); continue; }
    if (/^export\s/.test(t)) { kept.push(t); continue; }
    if (/^(const|let|var)\s+[A-Z_]+\s*=/.test(t)) { kept.push(t); continue; }
    // PHP patterns
    if (/^(require|require_once|include|include_once)\s/.test(t)) { kept.push(t); continue; }
    if (/^use\s/.test(t)) { kept.push(t); continue; }
    if (/^namespace\s/.test(t)) { kept.push(t); continue; }
    if (/^\$(this->)?\w+\s*=\s*new\s/.test(t)) { kept.push(t); continue; }
    // Python patterns
    if (/^(from\s+\S+\s+)?import\s/.test(t)) { kept.push(t); continue; }
    if (/^def\s/.test(t)) { kept.push(t); continue; }
    // Universal patterns
    if (/^(public|protected|private|static|abstract)?\s*(async\s+)?function\s/.test(t)) { kept.push(t); continue; }
    if (/^(abstract\s+)?class\s/.test(t)) { kept.push(t); continue; }
    if (/^\s*return\s/.test(line)) { kept.push(t); continue; }
    if (/^\s*throw\s/.test(line)) { kept.push(t); continue; }
    if (/^\s*(await\s|new\s|yield\s)/.test(line)) { kept.push(t); continue; }
    if (/\b(fs\.|path\.|JSON\.|process\.|child_process)/.test(t) && !/^\/\//.test(t)) { kept.push(t); continue; }
  }

  // If extraction is too sparse (< 5% of original), fall back to regular minify
  if (kept.length > 0 && kept.join("\n").length < code.length * 0.05) {
    return null; // signal caller to fall back
  }

  return kept.join("\n");
}

export function minify(code, filePath, opts) {
  if (!code) return code;

  if (opts?.mode === "essential") {
    const essential = extractEssential(code);
    if (essential !== null) return essential;
    // Fall back to regular minify if essential extraction is too sparse
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

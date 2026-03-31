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

export function minify(code, filePath) {
  if (!code) return code;

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

/**
 * src/presets/symfony/scan/php-attributes.js
 *
 * PHP 8 attribute extraction utility.
 * Two-step approach to avoid catastrophic backtracking:
 *   1. Find `public function` positions
 *   2. Walk backwards to collect preceding `#[...]` attribute lines
 */

const METHOD_RE = /public\s+function\s+(\w+)\s*\(/g;
const ATTR_LINE_RE = /^\s*#\[/;

/**
 * Find all public methods with their preceding attribute blocks.
 * Returns an array of { methodName, attrBlock, index } objects.
 *
 * @param {string} content - PHP file content
 * @returns {Array<{ methodName: string, attrBlock: string, index: number }>}
 */
export function findMethodsWithAttributes(content) {
  const lines = content.split("\n");

  // Build line offset index for mapping regex match positions to line numbers
  const lineOffsets = [];
  let offset = 0;
  for (const line of lines) {
    lineOffsets.push(offset);
    offset += line.length + 1; // +1 for \n
  }

  function offsetToLine(pos) {
    let lo = 0;
    let hi = lineOffsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineOffsets[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  const results = [];
  let m;
  while ((m = METHOD_RE.exec(content)) !== null) {
    const methodName = m[1];
    const methodLineIdx = offsetToLine(m.index);

    // Walk backwards from the line before the method to collect attribute lines
    const attrLines = [];
    for (let i = methodLineIdx - 1; i >= 0; i--) {
      const line = lines[i];
      const trimmed = line.trim();
      // Attribute line: starts with #[
      if (ATTR_LINE_RE.test(line)) {
        attrLines.unshift(line);
        continue;
      }
      // Empty line or continuation of attribute (indented, not a new statement)
      if (trimmed === "") break;
      // Non-attribute, non-empty line — stop
      break;
    }

    results.push({
      methodName,
      attrBlock: attrLines.join("\n"),
      index: m.index,
    });
  }

  return results;
}

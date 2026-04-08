/**
 * src/lib/formatter.js
 *
 * Shared text formatting helpers for CLI output.
 * Used by flow report, check commands, and other plain-text reporters.
 */

export const DIVIDER = "────────────────────────────────────────────────";

/**
 * Append a section header (blank line + indented title + indented divider) to lines.
 *
 * @param {string[]} lines - mutable lines array to push onto
 * @param {string} title - section title
 * @param {string} [divider] - override divider string (defaults to DIVIDER)
 */
export function pushSection(lines, title, divider = DIVIDER) {
  lines.push("");
  lines.push(`  ${title}`);
  lines.push(`  ${divider}`);
}

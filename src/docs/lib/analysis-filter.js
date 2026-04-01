/**
 * analysis-filter.js — docs.exclude filtering for analysis entries.
 *
 * Shared by enrich.js and data.js to apply docs.exclude patterns
 * consistently across the pipeline.
 */

import { globToRegex } from "./scanner.js";
import { ANALYSIS_META_KEYS } from "./analysis-entry.js";

/**
 * Filter entries by docs.exclude glob patterns.
 * Entries matching any pattern are excluded.
 *
 * @param {Array} entries - array of { file, ... } objects
 * @param {string[]|undefined} excludePatterns - glob patterns
 * @returns {Array} filtered entries
 */
export function filterByDocsExclude(entries, excludePatterns) {
  if (!excludePatterns?.length) return entries;
  const regexes = excludePatterns.map((p) => globToRegex(p));
  return entries.filter((e) => {
    if (!e.file) return true;
    return !regexes.some((re) => re.test(e.file));
  });
}

/**
 * Filter an entire analysis object by docs.exclude patterns.
 * Returns a new analysis with excluded entries removed from each category's entries array.
 * Does not mutate the original.
 *
 * @param {Object} analysis - full analysis object
 * @param {string[]|undefined} excludePatterns - glob patterns
 * @returns {Object} filtered analysis (shallow copy with filtered entries)
 */
export function filterAnalysisByDocsExclude(analysis, excludePatterns) {
  if (!excludePatterns?.length) return analysis;

  const filtered = {};
  for (const [key, val] of Object.entries(analysis)) {
    if (ANALYSIS_META_KEYS.has(key)) {
      filtered[key] = val;
      continue;
    }
    if (!val || typeof val !== "object") {
      filtered[key] = val;
      continue;
    }
    if (!Array.isArray(val.entries)) {
      filtered[key] = val;
      continue;
    }
    filtered[key] = {
      ...val,
      entries: filterByDocsExclude(val.entries, excludePatterns),
    };
  }
  return filtered;
}

/**
 * tests/acceptance/lib/assertions.js
 *
 * Structural assertions for acceptance tests.
 * Also provides structured detection functions for report generation.
 *
 * detectUnfilledDirectives() and detectExposedDirectives() are the canonical
 * scanners. The assert* functions are thin wrappers that delegate to them.
 */

import fs from "fs";
import path from "path";
import assert from "node:assert/strict";
import { getChapterFiles } from "../../../src/docs/lib/command-context.js";

const DIRECTIVE_RE = /\{\{(data\s*:|text\s*[\[:]|\/data\}\}|\/text\}\})/;
const CODE_BLOCK_RE = /^(`{3,}|~{3,})/;

/**
 * Detect unfilled {{text}} directives with file name and line number.
 *
 * @param {string} docsDir - Absolute path to docs/
 * @param {string[]} files - Chapter file names
 * @returns {{ file: string, line: number }[]}
 */
export function detectUnfilledDirectives(docsDir, files) {
  const results = [];
  for (const f of files) {
    const content = fs.readFileSync(path.join(docsDir, f), "utf8");
    const lines = content.split("\n");
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      if (CODE_BLOCK_RE.test(lines[i].trim())) { inCodeBlock = !inCodeBlock; continue; }
      if (inCodeBlock) continue;

      if (/<!--\s*\{\{text\b/.test(lines[i])) {
        let hasContent = false;
        for (let j = i + 1; j < lines.length; j++) {
          if (/^<!--\s*\{\{\/text\}\}\s*-->$/.test(lines[j].trim())) break;
          if (lines[j].trim() !== "") { hasContent = true; break; }
        }
        if (!hasContent) {
          results.push({ file: f, line: i + 1 });
        }
      }
    }
  }
  return results;
}

/**
 * Detect exposed directives (outside comments/code) with file name and line number.
 *
 * @param {string} docsDir - Absolute path to docs/
 * @param {string[]} files - Chapter file names
 * @returns {{ file: string, line: number }[]}
 */
export function detectExposedDirectives(docsDir, files) {
  const results = [];
  for (const f of files) {
    const content = fs.readFileSync(path.join(docsDir, f), "utf8");
    const lines = content.split("\n");
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      if (CODE_BLOCK_RE.test(lines[i].trim())) { inCodeBlock = !inCodeBlock; continue; }
      if (inCodeBlock) continue;
      const stripped = lines[i].replace(/<!--[\s\S]*?-->/g, "").replace(/`[^`]+`/g, "");
      if (DIRECTIVE_RE.test(stripped)) {
        results.push({ file: f, line: i + 1 });
      }
    }
  }
  return results;
}

/**
 * Assert that chapter files exist in docs/ after init.
 *
 * @param {string} docsDir - Absolute path to docs/
 */
export function assertChaptersExist(docsDir) {
  const files = getChapterFiles(docsDir);
  assert.ok(
    files.length > 0,
    `Expected at least 1 chapter file in ${docsDir}, found 0`,
  );
  return files;
}

/**
 * Assert that no {{data}} directives are exposed (outside comments) after data step.
 *
 * @param {string} docsDir - Absolute path to docs/
 * @param {string[]} files - Chapter file names
 */
export function assertNoExposedDirectives(docsDir, files) {
  const found = detectExposedDirectives(docsDir, files);
  assert.equal(
    found.length,
    0,
    `Exposed directives found: ${found.map((d) => `${d.file}:${d.line}`).join(", ")}`,
  );
}

/**
 * Assert that all {{text}} directives have been filled after text step.
 *
 * @param {string} docsDir - Absolute path to docs/
 * @param {string[]} files - Chapter file names
 */
export function assertTextDirectivesFilled(docsDir, files) {
  const found = detectUnfilledDirectives(docsDir, files);
  assert.equal(
    found.length,
    0,
    `Unfilled text directives: ${found.map((d) => `${d.file}:${d.line}`).join(", ")}`,
  );
}

/**
 * Run all structural assertions.
 *
 * @param {string} docsDir - Absolute path to docs/
 * @returns {{ files: string[] }}
 */
export function assertStructure(docsDir) {
  const files = assertChaptersExist(docsDir);
  assertNoExposedDirectives(docsDir, files);
  assertTextDirectivesFilled(docsDir, files);
  return { files };
}

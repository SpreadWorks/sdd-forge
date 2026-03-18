/**
 * tests/acceptance/lib/assertions.js
 *
 * Structural assertions for acceptance tests.
 */

import fs from "fs";
import path from "path";
import assert from "node:assert/strict";
import { getChapterFiles } from "../../../src/docs/lib/command-context.js";
// checkOutputIntegrity inline — not exported from review.js
function checkOutputIntegrity(content) {
  const lines = content.split("\n");
  let exposedDirectives = 0;
  let inCodeBlock = false;
  for (const line of lines) {
    if (/^(`{3,}|~{3,})/.test(line.trim())) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    const stripped = line.replace(/<!--[\s\S]*?-->/g, "").replace(/`[^`]+`/g, "");
    if (/\{\{(data\s*:|text\s*[\[:]|\/data\}\}|\/text\}\})/.test(stripped)) {
      exposedDirectives++;
    }
  }
  return { exposedDirectives };
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
  for (const f of files) {
    const content = fs.readFileSync(path.join(docsDir, f), "utf8");
    const result = checkOutputIntegrity(content);
    assert.equal(
      result.exposedDirectives,
      0,
      `Exposed directives found in ${f}: ${result.exposedDirectives}`,
    );
  }
}

/**
 * Assert that all {{text}} directives have been filled after text step.
 *
 * @param {string} docsDir - Absolute path to docs/
 * @param {string[]} files - Chapter file names
 */
export function assertTextDirectivesFilled(docsDir, files) {
  for (const f of files) {
    const content = fs.readFileSync(path.join(docsDir, f), "utf8");
    const lines = content.split("\n");
    let unfilled = 0;

    for (let i = 0; i < lines.length; i++) {
      if (/<!--\s*\{\{text\b/.test(lines[i])) {
        let hasContent = false;
        for (let j = i + 1; j < lines.length; j++) {
          if (/^<!--\s*\{\{\/text\}\}\s*-->$/.test(lines[j].trim())) break;
          if (lines[j].trim() !== "") { hasContent = true; break; }
        }
        if (!hasContent) unfilled++;
      }
    }

    assert.equal(
      unfilled,
      0,
      `Unfilled text directives in ${f}: ${unfilled}`,
    );
  }
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

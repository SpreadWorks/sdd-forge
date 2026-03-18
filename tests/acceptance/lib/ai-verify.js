/**
 * tests/acceptance/lib/ai-verify.js
 *
 * AI-based quality verification for generated docs.
 */

import fs from "fs";
import path from "path";
import assert from "node:assert/strict";
import { callAgent, loadAgentConfig } from "../../../src/lib/agent.js";
import { getChapterFiles } from "../../../src/docs/lib/command-context.js";

const VERIFY_TIMEOUT_MS = 180000;

/**
 * Build the verification prompt for the AI.
 *
 * @param {string} docsContent - Concatenated docs content
 * @param {string} fixtureDescription - Description of the fixture for context
 * @returns {string}
 */
function buildVerifyPrompt(docsContent, fixtureDescription) {
  return [
    "You are a documentation quality reviewer.",
    "",
    "## Fixture Description",
    fixtureDescription,
    "",
    "## Generated Documentation",
    docsContent,
    "",
    "## Verification Instructions",
    "Review the generated documentation against the fixture description and check:",
    "",
    "1. **Completeness**: Are the key components described in the fixture (dependencies,",
    "   database tables/relations, routes, controllers, models, CLI commands) mentioned",
    "   in the documentation? Minor omissions are acceptable; major components missing is a failure.",
    "",
    "2. **Consistency**: Is there any contradictory information between chapters?",
    "   Repeated context (e.g. overview + detail chapter) is acceptable; contradictions are not.",
    "",
    "3. **Readability**: Are there broken sentences, garbled text, or meaningless content?",
    "   Placeholder text like section headings with no content is acceptable if the heading",
    "   itself is meaningful.",
    "",
    "## Output Format",
    "Return ONLY a JSON object (no markdown fences, no explanation):",
    '{ "pass": true }',
    "or",
    '{ "pass": false, "issues": ["issue 1", "issue 2"] }',
    "",
    "Be lenient: pass unless there are clear, significant problems.",
  ].join("\n");
}

/**
 * Build a description of the fixture for the AI.
 *
 * @param {string} tmp - Fixture root directory
 * @param {string} presetName - Preset name
 * @returns {string}
 */
function buildFixtureDescription(tmp, presetName) {
  const parts = [`Preset: ${presetName}`];

  // List source files
  const srcFiles = [];
  function walk(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), rel);
      } else {
        srcFiles.push(rel);
      }
    }
  }

  // Scan common source directories
  for (const dir of ["src", "app", "routes", "config", "database", "migrations"]) {
    walk(path.join(tmp, dir), dir);
  }

  if (srcFiles.length > 0) {
    parts.push(`\nSource files (${srcFiles.length}):`);
    for (const f of srcFiles) parts.push(`- ${f}`);
  }

  // Package info
  for (const pkgFile of ["package.json", "composer.json"]) {
    const pkgPath = path.join(tmp, pkgFile);
    if (fs.existsSync(pkgPath)) {
      const content = fs.readFileSync(pkgPath, "utf8");
      parts.push(`\n${pkgFile}:`);
      parts.push(content);
    }
  }

  return parts.join("\n");
}

/**
 * Run AI quality verification on generated docs.
 *
 * @param {string} tmp - Project root
 * @param {Object} config - SddConfig
 * @param {string} presetName - Preset name for context
 */
export async function verifyWithAI(tmp, config, presetName) {
  const agent = loadAgentConfig(config);
  const docsDir = path.join(tmp, "docs");
  const files = getChapterFiles(docsDir);

  // Concatenate all docs
  const docsContent = files
    .map((f) => {
      const content = fs.readFileSync(path.join(docsDir, f), "utf8");
      return `--- ${f} ---\n${content}`;
    })
    .join("\n\n");

  // Also include README if it exists
  const readmePath = path.join(tmp, "README.md");
  const readmeContent = fs.existsSync(readmePath)
    ? `\n\n--- README.md ---\n${fs.readFileSync(readmePath, "utf8")}`
    : "";

  const fullDocs = docsContent + readmeContent;
  const fixtureDesc = buildFixtureDescription(tmp, presetName);
  const prompt = buildVerifyPrompt(fullDocs, fixtureDesc);

  const response = callAgent(agent, prompt, VERIFY_TIMEOUT_MS, tmp);

  // Parse response
  let result;
  try {
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    result = JSON.parse(cleaned);
  } catch (_) {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        result = JSON.parse(match[0]);
      } catch (__) {
        assert.fail(`AI returned unparseable response: ${response.slice(0, 500)}`);
      }
    } else {
      assert.fail(`AI returned no JSON: ${response.slice(0, 500)}`);
    }
  }

  if (!result.pass) {
    const issues = (result.issues || []).join("\n  - ");
    assert.fail(`AI quality check failed for ${presetName}:\n  - ${issues}`);
  }
}

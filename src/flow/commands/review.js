#!/usr/bin/env node
/**
 * src/flow/commands/review.js
 *
 * sdd-forge flow review — code quality review after implementation.
 * Phases: confirm → draft (propose) → final (validate) → approve → apply
 *
 * --phase test: test sufficiency review before impl.
 * Internal pipeline: generate test design → compare with test code → auto-fix loop.
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig } from "../../lib/config.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { loadAgentConfig, callAgent, resolveAgent, ensureAgentWorkDir } from "../../lib/agent.js";
import { runCmd } from "../../lib/process.js";
import { EXIT_ERROR } from "../../lib/exit-codes.js";
import { VALID_PHASES } from "../lib/phases.js";

/** Maximum retry iterations for review auto-fix loops (test and spec). */
const MAX_REVIEW_RETRIES = 3;

/** Supported review phases and their descriptions. */
const REVIEW_PHASES = {
  test: "test sufficiency",
  spec: "spec completeness",
};

// Validate REVIEW_PHASES keys are a subset of VALID_PHASES
for (const key of Object.keys(REVIEW_PHASES)) {
  if (!VALID_PHASES.includes(key)) {
    throw new Error(`REVIEW_PHASES key '${key}' is not in VALID_PHASES`);
  }
}

/**
 * Resolve review target files from spec scope or git diff fallback.
 *
 * @param {string} root - repo root
 * @param {import("../../lib/flow-state.js").FlowState} flow - flow state
 * @returns {string} diff text for review
 */
function resolveReviewTarget(root, flow) {
  const specPath = path.resolve(root, flow.spec);

  // Try to extract scope from spec.md
  if (fs.existsSync(specPath)) {
    const specText = fs.readFileSync(specPath, "utf8");
    const scopeMatch = specText.match(/^## Scope\n([\s\S]*?)(?=\n## )/m);
    if (scopeMatch) {
      const scopeFiles = scopeMatch[1]
        .split("\n")
        .map((l) => l.replace(/^[-*]\s*/, "").trim())
        .filter((l) => /\.(js|ts|json|md)$/.test(l))
        .map((l) => l.replace(/`/g, ""));

      if (scopeFiles.length > 0) {
        const diffs = [];
        for (const f of scopeFiles) {
          const abs = path.resolve(root, f);
          if (!fs.existsSync(abs)) continue;
          // Committed changes against base branch
          const committed = runCmd("git", ["-C", root, "diff", flow.baseBranch, "--", f]);
          if (committed.ok && committed.stdout.trim()) diffs.push(committed.stdout);
          // Staged but uncommitted changes
          const staged = runCmd("git", ["-C", root, "diff", "--cached", "--", f]);
          if (staged.ok && staged.stdout.trim()) diffs.push(staged.stdout);
        }
        if (diffs.length > 0) return diffs.join("\n");
      }
    }
  }

  // Fallback: committed diff against base branch + staged changes
  const parts = [];
  const committed = runCmd("git", ["-C", root, "diff", flow.baseBranch]);
  if (committed.ok && committed.stdout.trim()) parts.push(committed.stdout);
  const staged = runCmd("git", ["-C", root, "diff", "--cached"]);
  if (staged.ok && staged.stdout.trim()) parts.push(staged.stdout);
  return parts.join("\n");
}

/**
 * Build system prompt for the draft phase.
 */
function buildDraftSystemPrompt() {
  return [
    "You are a code quality reviewer. Analyze the following code changes and propose improvements.",
    "Focus on:",
    "- Duplicate code elimination",
    "- Naming improvements",
    "- Dead code removal",
    "- Design pattern consistency",
    "- Simplification opportunities",
    "",
    "Output a numbered list of proposals in this format:",
    "### 1. <title>",
    "**File:** `<path>`",
    "**Issue:** <description of the problem>",
    "**Suggestion:** <concrete improvement>",
    "",
    "If no improvements are needed, output: NO_PROPOSALS",
  ].join("\n");
}

/**
 * Build system prompt for the final (validation) phase.
 */
function buildFinalSystemPrompt() {
  return [
    "You are a senior code reviewer validating refactoring proposals.",
    "For each proposal, judge whether it:",
    "1. Actually improves code quality",
    "2. Does not break existing behavior",
    "",
    "Output each proposal with a verdict:",
    "### <number>. <title>",
    "**Verdict:** APPROVED or REJECTED",
    "**Reason:** <brief justification>",
    "",
    "Be conservative. Reject proposals that are cosmetic-only or risk breaking behavior.",
  ].join("\n");
}

/**
 * Parse proposals from draft output.
 * @param {string} text
 * @returns {{ title: string, body: string }[]}
 */
function parseProposals(text) {
  const proposals = [];
  const parts = text.split(/^### /m).filter(Boolean);
  for (const part of parts) {
    const nlIdx = part.indexOf("\n");
    const title = nlIdx >= 0 ? part.slice(0, nlIdx).trim() : part.trim();
    const body = nlIdx >= 0 ? part.slice(nlIdx + 1).trim() : "";
    proposals.push({ title, body });
  }
  return proposals;
}

/**
 * Parse verdicts from final output and merge into proposals.
 * @param {string} text
 * @param {{ title: string, body: string }[]} proposals
 * @returns {{ title: string, body: string, verdict: string, reason: string }[]}
 */
function mergeVerdicts(text, proposals) {
  const verdictMap = new Map();
  const parts = text.split(/^### /m).filter(Boolean);
  for (const part of parts) {
    const numMatch = part.match(/^(\d+)\./);
    if (!numMatch) continue;
    const idx = parseInt(numMatch[1], 10) - 1;
    const verdictMatch = part.match(/\*\*Verdict:\*\*\s*(APPROVED|REJECTED)/i);
    const reasonMatch = part.match(/\*\*Reason:\*\*\s*(.+)/);
    verdictMap.set(idx, {
      verdict: verdictMatch ? verdictMatch[1].toUpperCase() : "REJECTED",
      reason: reasonMatch ? reasonMatch[1].trim() : "",
    });
  }

  return proposals.map((p, i) => {
    const v = verdictMap.get(i) || { verdict: "REJECTED", reason: "No verdict provided" };
    return { ...p, verdict: v.verdict, reason: v.reason };
  });
}

/**
 * Generate review.md content.
 */
function formatReviewMd(results) {
  const lines = ["# Code Review Results", ""];
  for (const r of results) {
    const mark = r.verdict === "APPROVED" ? "[x]" : "[ ]";
    lines.push(`### ${mark} ${r.title}`);
    lines.push(r.body);
    lines.push("");
    lines.push(`**Verdict:** ${r.verdict}`);
    if (r.reason) lines.push(`**Reason:** ${r.reason}`);
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Build the apply prompt from approved proposals and diff.
 */
function buildApplyPrompt(approved, diff) {
  const proposalText = approved
    .map((p, i) => `### ${i + 1}. ${p.title}\n${p.body}`)
    .join("\n\n");

  return [
    "Apply the following approved refactoring proposals to the code.",
    "Make only the changes described. Do not add unrelated improvements.",
    "",
    "## Approved Proposals",
    proposalText,
    "",
    "## Current Diff (for context)",
    diff,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Common review loop
// ---------------------------------------------------------------------------

/**
 * Run a review-fix loop up to maxRetries times.
 * @param {Object} opts
 * @param {number} opts.maxRetries - Maximum iterations
 * @param {string} opts.label - Log label (e.g. "test-review", "spec-review")
 * @param {boolean} opts.dryRun - Skip fix phase if true
 * @param {() => Promise<{issues: Object[], raw: string}>} opts.detect - Detect issues. Return { issues, raw }.
 * @param {(raw: string) => Promise<void>} opts.fix - Apply fixes based on raw detection output.
 * @returns {Promise<{history: string[], finalIssues: Object[], verdict: string}>}
 */
async function runReviewLoop({ maxRetries, label, dryRun, detect, fix }) {
  const history = [];
  let finalIssues = [];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.error(`  [${label}] Analysis (attempt ${attempt + 1}/${maxRetries})...`);
    const { issues, raw } = await detect();
    history.push(raw);

    if (issues.length === 0) {
      console.error(`  [${label}] No issues found. PASS.`);
      finalIssues = [];
      break;
    }

    console.error(`  [${label}] ${issues.length} issue(s) found.`);
    finalIssues = issues;

    if (dryRun) {
      console.error(`  [${label}] (dry-run: skipping auto-fix)`);
      break;
    }

    console.error(`  [${label}] Applying fixes...`);
    await fix(raw);
  }

  // Verification detect: if loop ended with issues, run one more detect to check
  // whether the last fix resolved them. This handles the case where the previous
  // code skipped fix on the last iteration, missing fixes that resolved all issues.
  if (finalIssues.length > 0 && !dryRun) {
    console.error(`  [${label}] Verification detect...`);
    const { issues, raw } = await detect();
    history.push(raw);
    if (issues.length === 0) {
      console.error(`  [${label}] Verification PASS — all issues resolved.`);
      finalIssues = [];
    } else {
      console.error(`  [${label}] Verification: ${issues.length} issue(s) still remain.`);
      finalIssues = issues;
    }
  }

  const verdict = finalIssues.length === 0 ? "PASS" : "FAIL";
  return { history, finalIssues, verdict };
}

// ---------------------------------------------------------------------------
// Test review pipeline (--phase test)
// ---------------------------------------------------------------------------

/**
 * Extract Requirements section from spec.md.
 * @param {string} specText
 * @returns {string}
 */
function extractRequirements(specText) {
  const match = specText.match(/^## Requirements\n([\s\S]*?)(?=\n## )/m);
  return match ? match[1].trim() : "";
}

/**
 * Collect test files from spec-local tests/ and project tests/.
 * Spec-local takes precedence for same-name files.
 * @param {string} root
 * @param {string} specDir - relative spec directory
 * @returns {{ name: string, content: string, source: string }[]}
 */
function collectTestFiles(root, specDir) {
  const files = new Map();

  // Project-level tests/ (fallback)
  const projectTestDir = path.resolve(root, "tests");
  if (fs.existsSync(projectTestDir)) {
    collectTestsRecursive(projectTestDir, projectTestDir, files, "tests/");
  }

  // Spec-local tests/ (takes precedence)
  const specTestDir = path.resolve(root, specDir, "tests");
  if (fs.existsSync(specTestDir)) {
    collectTestsRecursive(specTestDir, specTestDir, files, `${specDir}/tests/`);
  }

  return Array.from(files.values());
}

/**
 * Recursively collect test files from a directory.
 */
function collectTestsRecursive(dir, baseDir, fileMap, sourcePrefix) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTestsRecursive(full, baseDir, fileMap, sourcePrefix);
    } else if (/\.(test|spec)\.(js|ts|mjs)$/.test(entry.name)) {
      const relName = path.relative(baseDir, full);
      const content = fs.readFileSync(full, "utf8");
      fileMap.set(relName, { name: relName, content, source: sourcePrefix + relName });
    }
  }
}

/**
 * Build the test design generation prompt.
 */
function buildTestDesignPrompt(requirements) {
  return [
    "You are a test design expert. Based on the following spec requirements, generate a comprehensive test design.",
    "List what should be tested, including:",
    "- Happy path scenarios",
    "- Edge cases and boundary conditions",
    "- Error paths and failure modes",
    "- Test type balance (unit / integration / acceptance)",
    "",
    "Output format:",
    "### Test Design",
    "For each test case:",
    "- **TC-N: <title>**",
    "  - Type: unit|integration|acceptance",
    "  - Input: <description>",
    "  - Expected: <description>",
    "",
    "## Requirements",
    requirements,
  ].join("\n");
}

/**
 * Serialize test files into markdown code blocks for prompts.
 */
function formatTestFilesForPrompt(testFiles) {
  if (testFiles.length === 0) return "(no test files found)";
  return testFiles
    .map((f) => `### ${f.source}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");
}

/**
 * Build the gap analysis prompt.
 */
function buildGapAnalysisPrompt(testDesign, testFiles) {
  return [
    "You are a test quality reviewer. Compare the test design against actual test code and identify gaps.",
    "",
    "For each gap, output:",
    "### GAP-N: <title>",
    "**Missing:** <what is not tested>",
    "**Severity:** HIGH|MEDIUM|LOW",
    "**Fix:** <concrete suggestion for test code>",
    "",
    "If all test cases are adequately covered, output: NO_GAPS",
    "",
    "## Test Design",
    testDesign,
    "",
    "## Existing Test Code",
    formatTestFilesForPrompt(testFiles),
  ].join("\n");
}

/**
 * Build the test fix prompt.
 */
function buildTestFixPrompt(gaps, testFiles) {
  return [
    "You are a test engineer. Fix the following gaps in the test code.",
    "Output the complete updated test file(s) with fixes applied.",
    "For each file, output:",
    "### FILE: <path>",
    "```",
    "<complete file content>",
    "```",
    "",
    "Only modify files that need changes. Do not add unrelated tests.",
    "Note: constant definitions may be wrapped in Object.freeze(), Object.seal(), or similar. When writing regex patterns to match definitions, account for these wrappers (e.g. `=\\s*(?:Object\\.freeze\\()?\\[` instead of `=\\s*\\[`).",
    "",
    "## Gaps to fix",
    gaps,
    "",
    "## Current test code",
    formatTestFilesForPrompt(testFiles),
  ].join("\n");
}

/**
 * Parse gap analysis output.
 * @param {string} text
 * @returns {{ title: string, body: string }[]}
 */
function parseGaps(text) {
  if (/NO_GAPS/i.test(text)) return [];
  const gaps = [];
  const parts = text.split(/^### GAP-/m).filter(Boolean);
  for (const part of parts) {
    const nlIdx = part.indexOf("\n");
    const title = nlIdx >= 0 ? part.slice(0, nlIdx).trim() : part.trim();
    const body = nlIdx >= 0 ? part.slice(nlIdx + 1).trim() : "";
    gaps.push({ title, body });
  }
  return gaps;
}

/**
 * Parse file fix output and apply to disk.
 * @param {string} text - AI output with ### FILE: <path> blocks
 * @param {string} root
 * @returns {string[]} paths of files written
 */
function applyTestFixes(text, root) {
  const written = [];
  const fileParts = text.split(/^### FILE:\s*/m).filter(Boolean);
  for (const part of fileParts) {
    const nlIdx = part.indexOf("\n");
    if (nlIdx < 0) continue;
    const filePath = part.slice(0, nlIdx).trim();
    const codeMatch = part.match(/```(?:\w*)\n([\s\S]*?)```/);
    if (!codeMatch) continue;
    const absPath = path.resolve(root, filePath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absPath, codeMatch[1]);
    written.push(filePath);
  }
  return written;
}

/**
 * Format test-review.md content.
 */
function formatTestReviewMd(testDesign, gapHistory, finalVerdict, remainingGaps) {
  const lines = ["# Test Review Results", ""];
  lines.push("## Test Design");
  lines.push("See [tests/spec.md](tests/spec.md) for the full test design.");
  lines.push("");
  lines.push("## Gap Analysis");
  for (let i = 0; i < gapHistory.length; i++) {
    if (gapHistory.length > 1) lines.push(`### Iteration ${i + 1}`);
    lines.push(gapHistory[i]);
    lines.push("");
  }
  lines.push(`## Verdict: ${finalVerdict}`);
  if (finalVerdict === "FAIL" && remainingGaps.length > 0) {
    lines.push("");
    lines.push("### Remaining Gaps");
    for (const g of remainingGaps) {
      lines.push(`- ${g.title}`);
      lines.push(`  ${g.body}`);
    }
  }
  return lines.join("\n");
}

/**
 * Run the test review pipeline.
 */
async function runTestReview(root, flow, config, dryRun) {
  const specDir = path.dirname(flow.spec);
  const specPath = path.resolve(root, flow.spec);

  if (!fs.existsSync(specPath)) {
    console.error("Error: spec.md not found");
    process.exit(EXIT_ERROR);
  }

  const specText = fs.readFileSync(specPath, "utf8");
  const requirements = extractRequirements(specText);
  if (!requirements) {
    console.error("Error: no Requirements section found in spec.md");
    process.exit(EXIT_ERROR);
  }

  const agent = loadAgentConfig(config, "flow.review.test");
  ensureAgentWorkDir(agent, root);

  // Step 1: Generate test design
  console.error("  [test-review] Generating test design...");
  const testDesign = await callAgent(
    agent,
    buildTestDesignPrompt(requirements),
    undefined,
    root,
    { systemPrompt: "You are a test design expert. Output a structured test design." },
  );
  // Save test design as tests/spec.md
  const testsDir = path.resolve(root, specDir, "tests");
  if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir, { recursive: true });
  const testSpecPath = path.join(testsDir, "spec.md");
  fs.writeFileSync(testSpecPath, `# Test Design\n\n${testDesign}\n`);
  console.error(`  [test-review] Test design saved to ${path.relative(root, testSpecPath)}`);

  // Step 2-3: Compare and retry loop (using common runReviewLoop)
  let testFiles = collectTestFiles(root, specDir);

  const { history: gapHistory, finalIssues: finalGaps, verdict } = await runReviewLoop({
    maxRetries: MAX_REVIEW_RETRIES,
    label: "test-review",
    dryRun,
    async detect() {
      const raw = await callAgent(
        agent,
        buildGapAnalysisPrompt(testDesign, testFiles),
        undefined,
        root,
        { systemPrompt: "You are a test quality reviewer. Identify gaps between test design and test code." },
      );
      return { issues: parseGaps(raw), raw };
    },
    async fix(raw) {
      const fixResult = await callAgent(
        agent,
        buildTestFixPrompt(raw, testFiles),
        undefined,
        root,
        { systemPrompt: "You are a test engineer. Fix test gaps by writing complete updated test files." },
      );
      const written = applyTestFixes(fixResult, root);
      if (written.length > 0) {
        console.error(`  [test-review] Fixed ${written.length} file(s): ${written.join(", ")}`);
      } else {
        console.error("  [test-review] No files were updated by fix attempt.");
      }
      testFiles = collectTestFiles(root, specDir);
    },
  });
  const testReviewPath = path.join(path.resolve(root, specDir), "test-review.md");
  fs.writeFileSync(testReviewPath, formatTestReviewMd(testDesign, gapHistory, verdict, finalGaps));
  console.error(`  [test-review] Results saved to ${path.relative(root, testReviewPath)}`);

  if (verdict === "PASS") {
    console.log("Test review PASS. All test cases are adequately covered.");
  } else {
    console.log(`Test review FAIL. ${finalGaps.length} gap(s) remaining after ${MAX_REVIEW_RETRIES} attempts.`);
    console.error(`  [test-review] verdict=FAIL gaps=${finalGaps.length}`);
    process.exit(EXIT_ERROR);
  }
}

// ---------------------------------------------------------------------------
// Spec review pipeline (--phase spec)
// ---------------------------------------------------------------------------

/**
 * Extract Goal and Scope sections from spec.md for context search query.
 * @param {string} specText
 * @returns {string}
 */
function extractGoalAndScope(specText) {
  const parts = [];
  for (const heading of ["Goal", "Scope"]) {
    const match = specText.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=\\n## )`, "m"));
    if (match) parts.push(match[1].trim());
  }
  return parts.join("\n");
}

/**
 * Build the spec review prompt.
 * @param {string} specText - Full spec.md content
 * @param {Object[]} contextEntries - Related codebase entries from contextSearch
 * @returns {string}
 */
function buildSpecReviewPrompt(specText, contextEntries) {
  const contextText = contextEntries.map((e) =>
    `- **${e.file}**: ${e.summary || "(no summary)"}${e.detail ? "\n  " + e.detail : ""}`
  ).join("\n");

  return [
    "You are a spec completeness reviewer. Analyze the following spec against the codebase context to identify oversights.",
    "Focus on:",
    "- Files or features around modules in Scope that the spec does not mention",
    "- Related code not explicitly listed in Out of Scope",
    "- External references (skill templates, tests, config) that depend on files to be deleted or moved",
    "- Contradictions or gaps between requirements",
    "",
    "Output a numbered list of proposals in this format:",
    "### 1. <title>",
    "**File:** `<path>` (the file that the spec overlooks)",
    "**Issue:** <what the spec misses or gets wrong>",
    "**Suggestion:** <concrete improvement to the spec>",
    "",
    "If no oversights are found, output: NO_PROPOSALS",
    "",
    "## Spec",
    specText,
    "",
    "## Codebase Context (related files)",
    contextText,
  ].join("\n");
}

/**
 * Build the spec fix prompt.
 * @param {string} specText - Current spec.md content
 * @param {string} proposals - Approved proposals text
 * @returns {string}
 */
function buildSpecFixPrompt(specText, proposals) {
  return [
    "Apply the following approved proposals to improve the spec.",
    "Output the complete updated spec.md content.",
    "Make only the changes described in the proposals. Do not add unrelated modifications.",
    "Preserve all existing sections and formatting.",
    "",
    "## Approved Proposals",
    proposals,
    "",
    "## Current Spec",
    specText,
  ].join("\n");
}

/**
 * Format spec-review.md content.
 * @param {string[]} history - Raw review outputs per iteration
 * @param {string} verdict - PASS or FAIL
 * @param {Object[]} finalIssues - Remaining issues if FAIL
 * @returns {string}
 */
function formatSpecReviewMd(history, verdict, finalIssues) {
  const lines = ["# Spec Review Results", ""];
  lines.push("## Review Iterations");
  for (let i = 0; i < history.length; i++) {
    if (history.length > 1) lines.push(`### Iteration ${i + 1}`);
    lines.push(history[i]);
    lines.push("");
  }
  lines.push(`## Verdict: ${verdict}`);
  if (verdict === "FAIL" && finalIssues.length > 0) {
    lines.push("");
    lines.push("### Remaining Issues");
    for (const p of finalIssues) {
      lines.push(`- ${p.title}`);
      if (p.body) lines.push(`  ${p.body}`);
    }
  }
  return lines.join("\n");
}

/**
 * Run the spec review pipeline.
 */
async function runSpecReview(root, flow, config, dryRun) {
  const specPath = path.resolve(root, flow.spec);
  const specDir = path.dirname(flow.spec);

  if (!fs.existsSync(specPath)) {
    console.error("Error: spec.md not found");
    process.exit(EXIT_ERROR);
  }

  // Load analysis data once (entries don't change during review)
  let analysisData = null;
  try {
    const { loadAnalysisEntries, contextSearch: ctxSearch } = await import("../lib/get-context.js");
    analysisData = { ...loadAnalysisEntries(root), ctxSearch };
  } catch (e) {
    console.error(`  [spec-review] Warning: failed to load codebase context: ${e.message}`);
  }

  const agent = loadAgentConfig(config, "flow.review.spec");
  ensureAgentWorkDir(agent, root);
  const validationAgent = loadAgentConfig(config, "flow.review.final");
  ensureAgentWorkDir(validationAgent, root);

  const { history, finalIssues, verdict } = await runReviewLoop({
    maxRetries: MAX_REVIEW_RETRIES,
    label: "spec-review",
    dryRun,
    async detect() {
      // Re-read spec and recompute context on each iteration (spec may have been modified by fix)
      const specText = fs.readFileSync(specPath, "utf8");
      let contextEntries = [];
      if (analysisData) {
        const searchQuery = extractGoalAndScope(specText);
        if (searchQuery) {
          contextEntries = analysisData.ctxSearch(analysisData.entries, analysisData.analysis, searchQuery, root);
        }
      }
      const raw = await callAgent(
        agent,
        buildSpecReviewPrompt(specText, contextEntries),
        undefined,
        root,
        { systemPrompt: "You are a spec completeness reviewer. Identify oversights in the spec." },
      );
      if (raw.includes("NO_PROPOSALS")) return { issues: [], raw };
      const issues = parseProposals(raw);
      return { issues, raw };
    },
    async fix(raw) {
      const specText = fs.readFileSync(specPath, "utf8");
      const proposals = parseProposals(raw);
      const validationResult = await callAgent(
        validationAgent,
        [
          "Validate these spec improvement proposals:",
          "",
          raw,
          "",
          "## Current spec for context:",
          specText,
        ].join("\n"),
        undefined,
        root,
        { systemPrompt: buildFinalSystemPrompt() },
      );
      const results = mergeVerdicts(validationResult, proposals);
      const approved = results.filter((r) => r.verdict === "APPROVED");

      if (approved.length === 0) {
        console.error("  [spec-review] All proposals rejected. Skipping fix.");
        return;
      }

      console.error(`  [spec-review] ${approved.length} proposal(s) approved. Applying to spec...`);

      const approvedText = approved.map((p, i) => `### ${i + 1}. ${p.title}\n${p.body}`).join("\n\n");
      const fixResult = await callAgent(
        agent,
        buildSpecFixPrompt(specText, approvedText),
        undefined,
        root,
        { systemPrompt: "You are a spec writer. Apply the approved proposals to produce an updated spec." },
      );

      // Extract spec content (strip markdown fences if present)
      const cleaned = fixResult.replace(/^```(?:markdown)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      if (!isValidSpecOutput(cleaned)) {
        console.error("  [spec-review] WARNING: AI output is not valid spec content. Keeping original spec.md.");
        return;
      }
      fs.writeFileSync(specPath, cleaned + "\n");
      console.error("  [spec-review] spec.md updated.");
    },
  });

  // Save review results
  const reviewPath = path.join(path.resolve(root, specDir), "spec-review.md");
  fs.writeFileSync(reviewPath, formatSpecReviewMd(history, verdict, finalIssues));
  console.error(`  [spec-review] Results saved to ${path.relative(root, reviewPath)}`);
  console.error(`  [spec-review] verdict=${verdict} issues=${finalIssues.length}`);

  if (verdict === "PASS") {
    console.log("Spec review PASS. No oversights found.");
  } else {
    console.log(`Spec review FAIL. ${finalIssues.length} issue(s) remaining after ${MAX_REVIEW_RETRIES} attempts.`);
    process.exit(EXIT_ERROR);
  }
}

async function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run", "--skip-confirm"],
    options: ["--phase"],
    defaults: { dryRun: false, skipConfirm: false, phase: null },
  });

  if (cli.help) {
    const phaseDesc = Object.entries(REVIEW_PHASES).map(([k, v]) => `'${k}' for ${v}`).join(", ");
    console.log([
      "Usage: sdd-forge flow review [options]",
      "",
      "Options:",
      `  --phase <type>   Review phase: ${phaseDesc}`,
      "  --dry-run        Show proposals without applying",
      "  --skip-confirm   Skip initial confirmation prompt",
    ].join("\n"));
    return;
  }

  if (cli.phase && !REVIEW_PHASES[cli.phase]) {
    const supported = Object.keys(REVIEW_PHASES).join(", ");
    console.error(`Error: unknown phase '${cli.phase}'. Supported: ${supported}`);
    process.exit(EXIT_ERROR);
  }

  const flow = loadFlowState(root);
  if (!flow) {
    console.error("Error: no active flow (flow.json not found)");
    process.exit(EXIT_ERROR);
  }

  let config;
  try {
    config = loadConfig(root);
  } catch (_) {
    console.error("Error: failed to load config.json");
    process.exit(EXIT_ERROR);
  }

  // Test review pipeline
  if (cli.phase === "test") {
    await runTestReview(root, flow, config, cli.dryRun);
    return;
  }

  // Spec review pipeline
  if (cli.phase === "spec") {
    await runSpecReview(root, flow, config, cli.dryRun);
    return;
  }

  // Resolve target diff
  const diff = resolveReviewTarget(root, flow);
  if (!diff) {
    console.log("No changes detected. Skipping review.");
    return;
  }

  // --- Draft phase ---
  console.error("  [draft] Generating proposals...");
  const draftAgent = loadAgentConfig(config, "flow.review.draft");
  ensureAgentWorkDir(draftAgent, root);
  const draftResult = await callAgent(
    draftAgent,
    diff,
    undefined,
    root,
    { systemPrompt: buildDraftSystemPrompt() },
  );

  if (draftResult.includes("NO_PROPOSALS")) {
    console.log("No improvement proposals found. Code looks good.");
    // Write empty review.md
    const specDir = path.dirname(path.resolve(root, flow.spec));
    const reviewPath = path.join(specDir, "review.md");
    fs.writeFileSync(reviewPath, "# Code Review Results\n\nNo proposals.\n");
    return;
  }

  const proposals = parseProposals(draftResult);
  if (proposals.length === 0) {
    console.log("No structured proposals found.");
    return;
  }

  console.error(`  [draft] ${proposals.length} proposal(s) generated.`);

  // --- Final phase ---
  console.error("  [final] Validating proposals...");
  const finalAgent = loadAgentConfig(config, "flow.review.final");
  ensureAgentWorkDir(finalAgent, root);
  const finalPrompt = [
    "Validate these refactoring proposals:",
    "",
    draftResult,
    "",
    "## Original diff for context:",
    diff,
  ].join("\n");

  const finalResult = await callAgent(
    finalAgent,
    finalPrompt,
    undefined,
    root,
    { systemPrompt: buildFinalSystemPrompt() },
  );

  const results = mergeVerdicts(finalResult, proposals);
  const approved = results.filter((r) => r.verdict === "APPROVED");
  const rejected = results.filter((r) => r.verdict === "REJECTED");

  // Write review.md
  const specDir = path.dirname(path.resolve(root, flow.spec));
  const reviewPath = path.join(specDir, "review.md");
  fs.writeFileSync(reviewPath, formatReviewMd(results));
  console.error(`  [final] Results saved to ${path.relative(root, reviewPath)}`);
  console.error(`  [final] ${approved.length} approved, ${rejected.length} rejected.`);

  if (approved.length === 0) {
    console.log("All proposals were rejected. No changes to apply.");
    return;
  }

  // --- Display and approval ---
  console.log("");
  console.log("Approved proposals:");
  for (const p of approved) {
    console.log(`  - ${p.title}`);
  }
  console.log("");

  if (cli.dryRun) {
    console.log("(dry-run: skipping apply phase)");
    return;
  }

  console.log("Review the proposals above and in review.md.");
}

/**
 * Validate that AI output looks like spec content, not garbage text.
 * @param {string} text
 * @returns {boolean}
 */
function isValidSpecOutput(text) {
  if (!text || !text.trim()) return false;
  return /^#\s+Feature Specification/m.test(text) || /^##\s+Goal/m.test(text);
}

export {
  main, parseProposals, mergeVerdicts, formatReviewMd, resolveReviewTarget,
  MAX_REVIEW_RETRIES, REVIEW_PHASES, extractRequirements, collectTestFiles, parseGaps,
  applyTestFixes, formatTestReviewMd, runReviewLoop,
  extractGoalAndScope, buildSpecReviewPrompt, formatSpecReviewMd,
  isValidSpecOutput, buildTestFixPrompt,
};

runIfDirect(import.meta.url, main);

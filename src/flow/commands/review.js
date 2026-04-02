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
import { runSync } from "../../lib/process.js";
import { EXIT_ERROR } from "../../lib/exit-codes.js";

/** Maximum retry iterations for test review auto-fix loop. */
const MAX_TEST_REVIEW_RETRIES = 3;

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
          const committed = runSync("git", ["-C", root, "diff", flow.baseBranch, "--", f]);
          if (committed.ok && committed.stdout.trim()) diffs.push(committed.stdout);
          // Staged but uncommitted changes
          const staged = runSync("git", ["-C", root, "diff", "--cached", "--", f]);
          if (staged.ok && staged.stdout.trim()) diffs.push(staged.stdout);
        }
        if (diffs.length > 0) return diffs.join("\n");
      }
    }
  }

  // Fallback: committed diff against base branch + staged changes
  const parts = [];
  const committed = runSync("git", ["-C", root, "diff", flow.baseBranch]);
  if (committed.ok && committed.stdout.trim()) parts.push(committed.stdout);
  const staged = runSync("git", ["-C", root, "diff", "--cached"]);
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
  lines.push("## Test Design Summary");
  lines.push(testDesign);
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
  console.error("  [test-review] Test design generated.");

  // Step 2-3: Compare and retry loop
  const gapHistory = [];
  let finalGaps = [];
  let testFiles = collectTestFiles(root, specDir);

  for (let attempt = 0; attempt < MAX_TEST_REVIEW_RETRIES; attempt++) {
    console.error(`  [test-review] Gap analysis (attempt ${attempt + 1}/${MAX_TEST_REVIEW_RETRIES})...`);
    const gapResult = await callAgent(
      agent,
      buildGapAnalysisPrompt(testDesign, testFiles),
      undefined,
      root,
      { systemPrompt: "You are a test quality reviewer. Identify gaps between test design and test code." },
    );
    gapHistory.push(gapResult);

    const gaps = parseGaps(gapResult);
    if (gaps.length === 0) {
      console.error("  [test-review] No gaps found. PASS.");
      finalGaps = [];
      break;
    }

    console.error(`  [test-review] ${gaps.length} gap(s) found.`);
    finalGaps = gaps;

    if (dryRun) {
      console.error("  [test-review] (dry-run: skipping auto-fix)");
      break;
    }

    if (attempt < MAX_TEST_REVIEW_RETRIES - 1) {
      console.error("  [test-review] Applying fixes...");
      const fixResult = await callAgent(
        agent,
        buildTestFixPrompt(gapResult, testFiles),
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
      // Reload test files for next comparison
      testFiles = collectTestFiles(root, specDir);
    }
  }

  const verdict = finalGaps.length === 0 ? "PASS" : "FAIL";
  const testReviewPath = path.join(path.resolve(root, specDir), "test-review.md");
  fs.writeFileSync(testReviewPath, formatTestReviewMd(testDesign, gapHistory, verdict, finalGaps));
  console.error(`  [test-review] Results saved to ${path.relative(root, testReviewPath)}`);

  if (verdict === "PASS") {
    console.log("Test review PASS. All test cases are adequately covered.");
  } else {
    console.log(`Test review FAIL. ${finalGaps.length} gap(s) remaining after ${MAX_TEST_REVIEW_RETRIES} attempts.`);
    console.error(`  [test-review] verdict=FAIL gaps=${finalGaps.length}`);
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
    console.log([
      "Usage: sdd-forge flow review [options]",
      "",
      "Options:",
      "  --phase <type>   Review phase: 'test' for test sufficiency review",
      "  --dry-run        Show proposals without applying",
      "  --skip-confirm   Skip initial confirmation prompt",
    ].join("\n"));
    return;
  }

  if (cli.phase && cli.phase !== "test") {
    console.error(`Error: unknown phase '${cli.phase}'. Supported: test`);
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

export {
  main, parseProposals, mergeVerdicts, formatReviewMd, resolveReviewTarget,
  MAX_TEST_REVIEW_RETRIES, extractRequirements, collectTestFiles, parseGaps,
  applyTestFixes, formatTestReviewMd,
};

runIfDirect(import.meta.url, main);

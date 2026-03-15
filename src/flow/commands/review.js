#!/usr/bin/env node
/**
 * src/flow/commands/review.js
 *
 * sdd-forge flow review — code quality review after implementation.
 * Phases: confirm → draft (propose) → final (validate) → approve → apply
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig } from "../../lib/config.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { loadAgentConfig, callAgent, resolveAgent } from "../../lib/agent.js";
import { runSync } from "../../lib/process.js";

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
          const res = runSync("git", ["-C", root, "diff", flow.baseBranch, "--", f]);
          if (res.ok && res.stdout.trim()) diffs.push(res.stdout);
        }
        if (diffs.length > 0) return diffs.join("\n");
      }
    }
  }

  // Fallback: full diff against base branch
  const res = runSync("git", ["-C", root, "diff", flow.baseBranch]);
  return res.ok ? res.stdout : "";
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

async function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run", "--skip-confirm"],
    defaults: { dryRun: false, skipConfirm: false },
  });

  if (cli.help) {
    console.log([
      "Usage: sdd-forge flow review [options]",
      "",
      "Options:",
      "  --dry-run        Show proposals without applying",
      "  --skip-confirm   Skip initial confirmation prompt",
    ].join("\n"));
    return;
  }

  const flow = loadFlowState(root);
  if (!flow) {
    console.error("Error: no active flow (flow.json not found)");
    process.exit(1);
  }

  let config;
  try {
    config = loadConfig(root);
  } catch (_) {
    console.error("Error: failed to load config.json");
    process.exit(1);
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

  // In non-interactive mode, output proposals for user to decide
  console.log("Review the proposals above and in review.md.");
  console.log("To apply: sdd-forge flow review --apply");
  console.log("To skip:  continue to finalize.");
}

export { main, parseProposals, mergeVerdicts, formatReviewMd, resolveReviewTarget };

runIfDirect(import.meta.url, main);

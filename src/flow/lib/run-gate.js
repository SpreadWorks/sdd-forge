/**
 * src/flow/lib/run-gate.js
 *
 * FlowCommand: gate — check deliverable readiness for each phase.
 *
 * Phases:
 *   draft — check draft.md structure + guardrail compliance
 *   pre   — check spec.md structure + guardrail compliance (default, before approval)
 *   post  — check spec.md structure (stricter) + guardrail compliance (after approval)
 *   impl  — check spec requirements + git diff + guardrail compliance
 */

import fs from "fs";
import path from "path";
import { runCmd } from "../../lib/process.js";
import { callAgent, resolveAgent } from "../../lib/agent.js";
import { filterByPhase, loadMergedGuardrails } from "../../lib/guardrail.js";
import { FlowCommand } from "./base-command.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect which section a line belongs to by scanning headings above it.
 */
function sectionAt(lines, lineIdx) {
  for (let i = lineIdx - 1; i >= 0; i--) {
    const m = lines[i].match(/^\s*##\s+(.+)/);
    if (m) return m[1].trim();
  }
  return "";
}

// ---------------------------------------------------------------------------
// Text checks — spec (pre/post)
// ---------------------------------------------------------------------------

/**
 * @param {string} text
 * @param {{ phase?: "pre"|"post" }} [opts]
 * @returns {string[]} issues
 */
function checkSpecText(text, opts) {
  const phase = opts?.phase || "pre";
  const issues = [];
  const lines = text.split("\n");

  const PRE_SKIP_SECTIONS = /^(Status|Acceptance Criteria|User Scenarios\s*&?\s*Testing|User Confirmation)/i;

  const unresolvedPatterns = [
    /\[NEEDS CLARIFICATION\]/i,
    /\bTBD\b/i,
    /\bTODO\b/i,
    /\bFIXME\b/i,
  ];
  for (const [idx, line] of lines.entries()) {
    if (/^\s*\|/.test(line)) continue;

    for (const p of unresolvedPatterns) {
      if (p.test(line)) {
        issues.push(`line ${idx + 1}: unresolved token (${line.trim()})`);
        break;
      }
    }
    if (/^\s*-\s*\[\s\]\s+/.test(line)) {
      if (phase === "pre") {
        const section = sectionAt(lines, idx);
        if (PRE_SKIP_SECTIONS.test(section)) continue;
      }
      issues.push(`line ${idx + 1}: unchecked task/question (${line.trim()})`);
    }
  }

  if (!/^\s*##\s+Clarifications\b/im.test(text)) {
    issues.push("missing section: ## Clarifications");
  }
  if (!/^\s*##\s+Open Questions\b/im.test(text)) {
    issues.push("missing section: ## Open Questions");
  }
  if (!/^\s*##\s+User Confirmation\b/im.test(text)) {
    issues.push("missing section: ## User Confirmation");
  } else if (phase === "post") {
    const startMatch = text.match(/^\s*##\s+User Confirmation\b/im);
    const start = startMatch?.index ?? -1;
    const tail = start >= 0 ? text.slice(start) : "";
    const nextHeading = tail.slice(1).match(/\n\s*##\s+/m);
    const end = nextHeading ? start + 1 + (nextHeading.index ?? 0) : text.length;
    const block = start >= 0 ? text.slice(start, end) : "";
    const hasApproval =
      /-\s*\[\s*x\s*\]\s*(?:User approved this spec|この仕様で実装して問題ない)\b/i.test(block);
    if (!hasApproval) {
      issues.push(
        "user confirmation is required: set `- [x] User approved this spec` in ## User Confirmation",
      );
    }
  }
  const hasAcceptance =
    /^\s*##\s+Acceptance Criteria\b/im.test(text) ||
    /^\s*##\s+User Scenarios\s*&\s*Testing\b/im.test(text) ||
    /^\s*##\s+User Scenarios\b/im.test(text);
  if (!hasAcceptance) {
    issues.push(
      "missing section: ## Acceptance Criteria (or ## User Scenarios & Testing)",
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Text checks — draft
// ---------------------------------------------------------------------------

/**
 * @param {string} text
 * @returns {string[]} issues
 */
function checkDraftText(text) {
  const issues = [];

  // Q&A section
  if (!/##\s+Q&A/i.test(text)) {
    issues.push("missing Q&A section");
  }

  // User approval checkbox (checked)
  const hasApproval =
    /-\s*\[\s*x\s*\]\s*(?:User approved this draft|ユーザーがこの draft を承認した)/i.test(text);
  if (!hasApproval) {
    issues.push("draft approval is required: set `- [x] User approved this draft`");
  }

  // Development type
  const hasDevType =
    /\*{0,2}(?:開発種別|dev(?:elopment)?\s*type)\*{0,2}\s*[:：]/i.test(text);
  if (!hasDevType) {
    issues.push("missing development type (開発種別)");
  }

  // Goal
  const hasGoal =
    /\*{0,2}(?:目的|goal)\*{0,2}\s*[:：]/i.test(text);
  if (!hasGoal) {
    issues.push("missing goal (目的)");
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Guardrail AI check — shared
// ---------------------------------------------------------------------------

/**
 * Build AI prompt for guardrail compliance check.
 * @param {string} targetText - text to check (spec, draft, or requirements+diff)
 * @param {Array} guardrails - all guardrails (pre-filtered)
 * @param {string} phase - guardrail phase to filter
 * @param {string} [role] - checker role description override
 */
function buildGuardrailPrompt(targetText, guardrails, phase, role) {
  const filtered = filterByPhase(guardrails, phase);
  if (filtered.length === 0) return null;

  const articleList = filtered.map((g, i) =>
    `${i + 1}. **${g.title}**: ${g.body.trim()}`
  ).join("\n");

  const checkerRole = role || `You are a ${phase} compliance checker.`;

  const parts = [
    `${checkerRole} Check the following content against each guardrail article.`,
    "For each article, output exactly one line in this format:",
    "  PASS: <article title> — <brief reason>",
    "  FAIL: <article title> — <brief reason>",
    "",
    "If an article is inapplicable by nature of the content, mark it as PASS and state the reason.",
    "",
    "Output ONLY the result lines. No preamble, no summary.",
    "",
    "## Guardrail Articles",
    articleList,
    "",
    `## Content`,
    targetText,
  ];

  return parts.join("\n");
}

/**
 * Parse AI response into per-article results.
 */
function parseGuardrailResponse(response) {
  const results = [];
  for (const line of response.split("\n")) {
    const m = line.match(/^(PASS|FAIL):\s*(.+?)\s*[—–-]\s*(.+)/);
    if (m) {
      results.push({
        title: m[2].trim(),
        passed: m[1] === "PASS",
        reason: m[3].trim(),
      });
    }
  }
  return results;
}

/**
 * Run guardrail AI compliance check for a given phase.
 * @param {string} root
 * @param {string} targetText - text to check
 * @param {Object} config
 * @param {string} phase - "draft" | "spec" | "impl"
 * @param {string} [role] - checker role override
 */
function checkGuardrail(root, targetText, config, phase, role) {
  const guardrails = loadMergedGuardrails(root);
  if (guardrails.length === 0) return null;

  const agent = resolveAgent(config, "spec.gate");
  if (!agent) return null;

  const prompt = buildGuardrailPrompt(targetText, guardrails, phase, role);
  if (!prompt) return { passed: true, results: [] };

  const response = callAgent(agent, prompt);
  const results = parseGuardrailResponse(response);
  const passed = results.length > 0 && results.every((r) => r.passed);

  return { passed, results };
}

// ---------------------------------------------------------------------------
// Impl-specific: requirements check
// ---------------------------------------------------------------------------

/**
 * Build AI prompt for implementation requirements check.
 */
function buildImplCheckPrompt(specText, diff) {
  return [
    "You are an implementation compliance checker.",
    "Check whether each requirement in the spec has been implemented in the diff.",
    "For each requirement, output exactly one line in this format:",
    "  PASS: <requirement summary> — <brief reason>",
    "  FAIL: <requirement summary> — <brief reason>",
    "",
    "Output ONLY the result lines. No preamble, no summary.",
    "",
    "## Spec",
    specText,
    "",
    "## Git Diff",
    diff,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Phase → next-step mapping
// ---------------------------------------------------------------------------

const PASS_NEXT = { draft: "spec", pre: "approval", post: "approval", impl: "review" };
const FAIL_NEXT = { draft: "draft", pre: "spec", post: "spec", impl: "implement" };

// ---------------------------------------------------------------------------
// Result builders
// ---------------------------------------------------------------------------

function gatePass(phase, targetPath, reasons) {
  return {
    result: "pass",
    changed: [],
    artifacts: { target: targetPath, phase, reasons },
    next: PASS_NEXT[phase],
  };
}

function gateFail(phase, targetPath, reasons, issues) {
  return {
    result: "fail",
    changed: [],
    artifacts: { target: targetPath, phase, reasons, issues },
    next: FAIL_NEXT[phase],
  };
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export class RunGateCommand extends FlowCommand {
  async execute(ctx) {
    const { root } = ctx;
    const phase = ctx.phase || "pre";
    const skipGuardrail = ctx.skipGuardrail || false;

    if (phase === "draft") {
      return this.executeDraft(ctx, root, skipGuardrail);
    }
    if (phase === "impl") {
      return this.executeImpl(ctx, root, skipGuardrail);
    }
    return this.executeSpec(ctx, root, phase, skipGuardrail);
  }

  /**
   * Gate draft: check draft.md structure + guardrail AI compliance.
   */
  executeDraft(ctx, root, skipGuardrail) {
    const state = ctx.flowState;
    const specDir = state?.spec ? path.dirname(path.resolve(root, state.spec)) : null;
    if (!specDir) throw new Error("no active flow found");

    const draftPath = path.join(specDir, "draft.md");
    if (!fs.existsSync(draftPath)) {
      throw new Error(`draft not found: ${draftPath}`);
    }

    const text = fs.readFileSync(draftPath, "utf8");
    const relPath = path.relative(root, draftPath);

    // Text structure check
    const issues = checkDraftText(text);
    if (issues.length > 0) {
      return gateFail("draft", relPath, [], issues);
    }

    // Guardrail AI check
    const reasons = [];
    if (!skipGuardrail) {
      const result = checkGuardrail(
        root, text, ctx.config, "draft",
        "You are a draft compliance checker. Check whether the draft considered each guardrail perspective.",
      );
      if (result) {
        for (const r of result.results) {
          reasons.push({ verdict: r.passed ? "PASS" : "FAIL", detail: `${r.title} — ${r.reason}` });
        }
        if (!result.passed) {
          return gateFail("draft", relPath, reasons, []);
        }
      }
    }

    return gatePass("draft", relPath, reasons);
  }

  /**
   * Gate spec (pre/post): check spec.md structure + guardrail AI compliance.
   */
  executeSpec(ctx, root, phase, skipGuardrail) {
    const spec = ctx.spec || "";
    const resolvedPhase = phase === "post" ? "post" : "pre";

    let specPath = spec;
    if (!specPath) {
      const state = ctx.flowState;
      if (state?.spec) {
        specPath = state.spec;
      } else {
        throw new Error("no --spec provided and no active flow found");
      }
    }

    const absPath = path.resolve(root, specPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`spec not found: ${absPath}`);
    }

    const text = fs.readFileSync(absPath, "utf8");

    // Text-based checks
    const issues = checkSpecText(text, { phase: resolvedPhase });
    if (issues.length > 0) {
      return gateFail(resolvedPhase, specPath, [], issues);
    }

    // Guardrail AI compliance check
    const reasons = [];
    if (!skipGuardrail) {
      const result = checkGuardrail(root, text, ctx.config, "spec");
      if (result) {
        for (const r of result.results) {
          reasons.push({ verdict: r.passed ? "PASS" : "FAIL", detail: `${r.title} — ${r.reason}` });
        }
        if (!result.passed) {
          return gateFail(resolvedPhase, specPath, reasons, []);
        }
      }
    }

    return gatePass(resolvedPhase, specPath, reasons);
  }

  /**
   * Gate impl: check spec requirements against git diff + guardrail AI compliance.
   */
  executeImpl(ctx, root, skipGuardrail) {
    const state = ctx.flowState;
    if (!state?.spec) throw new Error("no active flow found");
    if (!state.baseBranch) throw new Error("baseBranch not set in flow.json");

    const specPath = state.spec;
    const absSpecPath = path.resolve(root, specPath);
    if (!fs.existsSync(absSpecPath)) {
      throw new Error(`spec not found: ${absSpecPath}`);
    }

    const specText = fs.readFileSync(absSpecPath, "utf8");

    // Get git diff
    const diffRes = runCmd("git", ["diff", `${state.baseBranch}...HEAD`], { cwd: root });
    if (!diffRes.ok) {
      throw new Error(`failed to get git diff: ${diffRes.stderr}`);
    }
    const diff = diffRes.stdout;

    if (!diff.trim()) {
      return gateFail("impl", specPath, [], ["no changes found against base branch"]);
    }

    // Requirements check via AI
    const agent = resolveAgent(ctx.config, "spec.gate");
    if (!agent) throw new Error("no agent configured for spec.gate");

    const reqPrompt = buildImplCheckPrompt(specText, diff);
    const reqResponse = callAgent(agent, reqPrompt);
    const reqResults = parseGuardrailResponse(reqResponse);

    const reasons = reqResults.map((r) => ({
      verdict: r.passed ? "PASS" : "FAIL",
      detail: `${r.title} — ${r.reason}`,
    }));

    const reqPassed = reqResults.length > 0 && reqResults.every((r) => r.passed);
    if (!reqPassed) {
      return gateFail("impl", specPath, reasons, []);
    }

    // Guardrail AI check
    if (!skipGuardrail) {
      const grResult = checkGuardrail(
        root, `${specText}\n\n## Git Diff\n${diff}`, ctx.config, "impl",
        "You are an implementation compliance checker. Check the implementation against each guardrail.",
      );
      if (grResult) {
        for (const r of grResult.results) {
          reasons.push({ verdict: r.passed ? "PASS" : "FAIL", detail: `${r.title} — ${r.reason}` });
        }
        if (!grResult.passed) {
          return gateFail("impl", specPath, reasons, []);
        }
      }
    }

    return gatePass("impl", specPath, reasons);
  }
}

export default RunGateCommand;
export { checkSpecText, checkDraftText, buildGuardrailPrompt, parseGuardrailResponse, checkGuardrail };

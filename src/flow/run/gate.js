/**
 * src/flow/run/gate.js
 *
 * flow run gate — check spec readiness before implementation.
 * Returns JSON envelope with PASS/FAIL result.
 */

import fs from "fs";
import path from "path";
import { parseArgs } from "../../lib/cli.js";
import { callAgent, resolveAgent } from "../../lib/agent.js";
import { filterByPhase, loadMergedGuardrails } from "../../lib/guardrail.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

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

/**
 * @param {string} text
 * @param {{ phase?: "pre"|"post" }} [opts]
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

/**
 * Build AI prompt for guardrail compliance check.
 */
function buildGuardrailPrompt(specText, guardrails) {
  const specGuardrails = filterByPhase(guardrails, "spec");

  if (specGuardrails.length === 0) return null;

  const articleList = specGuardrails.map((g, i) =>
    `${i + 1}. **${g.title}**: ${g.body.trim()}`
  ).join("\n");

  const parts = [
    "You are a spec compliance checker. Check the following spec against each guardrail article.",
    "For each article, output exactly one line in this format:",
    "  PASS: <article title> — <brief reason>",
    "  FAIL: <article title> — <brief reason>",
    "",
    "If an article is inapplicable by nature of the spec, mark it as PASS and state the reason.",
    "",
    "Output ONLY the result lines. No preamble, no summary.",
    "",
    "## Guardrail Articles",
    articleList,
    "",
    "## Spec",
    specText,
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
 * Run guardrail AI compliance check.
 */
function checkGuardrail(root, specText, config) {
  const guardrails = loadMergedGuardrails(root);
  if (guardrails.length === 0) return null;

  const agent = resolveAgent(config, "spec.gate");
  if (!agent) return null;

  const prompt = buildGuardrailPrompt(specText, guardrails);
  if (!prompt) return { passed: true, results: [] };

  const response = callAgent(agent, prompt);
  const results = parseGuardrailResponse(response);
  const passed = results.length > 0 && results.every((r) => r.passed);

  return { passed, results };
}

export async function execute(ctx) {
  const { root } = ctx;
  const cli = parseArgs(ctx.args, {
    options: ["--spec", "--phase"],
    flags: ["--skip-guardrail"],
    defaults: { spec: "", phase: "pre", skipGuardrail: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run gate [options]",
        "",
        "Run spec gate check. Resolves --spec from flow.json if omitted.",
        "",
        "Options:",
        "  --spec <path>       Path to spec.md (auto-resolved from flow.json)",
        "  --phase <pre|post>  Gate phase (default: pre)",
        "  --skip-guardrail    Skip AI guardrail compliance check",
      ].join("\n"),
    );
    return;
  }

  // Resolve spec path from flow state if not provided
  let specPath = cli.spec;
  if (!specPath) {
    const state = ctx.flowState;
    if (state?.spec) {
      specPath = state.spec;
    } else {
      output(fail("run", "gate", "NO_SPEC", "no --spec provided and no active flow found"));
      return;
    }
  }

  const absPath = path.resolve(root, specPath);
  if (!fs.existsSync(absPath)) {
    output(fail("run", "gate", "SPEC_NOT_FOUND", `spec not found: ${absPath}`));
    return;
  }

  const phase = cli.phase === "post" ? "post" : "pre";
  const text = fs.readFileSync(absPath, "utf8");

  // Text-based checks
  const issues = checkSpecText(text, { phase });
  if (issues.length > 0) {
    output(fail("run", "gate", "GATE_FAILED", [
      "spec gate check failed",
      ...issues,
    ]));
    return;
  }

  // Guardrail AI compliance check
  const reasons = [];
  if (!cli.skipGuardrail) {
    const result = checkGuardrail(root, text, ctx.config);
    if (result) {
      for (const r of result.results) {
        reasons.push({ verdict: r.passed ? "PASS" : "FAIL", detail: `${r.title} — ${r.reason}` });
      }
      if (!result.passed) {
        output(fail("run", "gate", "GATE_FAILED", [
          "spec gate check failed",
          ...reasons.filter((r) => r.verdict === "FAIL").map((r) => r.detail),
        ]));
        return;
      }
    }
  }

  output(ok("run", "gate", {
    result: "pass",
    changed: [],
    artifacts: {
      spec: specPath,
      phase,
      reasons,
    },
    next: "approval",
  }));
}

export { checkSpecText, buildGuardrailPrompt, parseGuardrailResponse, checkGuardrail };

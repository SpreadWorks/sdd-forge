#!/usr/bin/env node
/**
 * src/flow/run/gate.js
 *
 * flow run gate — check spec readiness before implementation.
 * Returns JSON envelope with PASS/FAIL result.
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { translate } from "../../lib/i18n.js";
import { loadConfig } from "../../lib/config.js";
import { callAgent, resolveAgent } from "../../lib/agent.js";
import { filterByPhase, loadMergedArticles } from "../../lib/guardrail.js";
import { loadFlowState } from "../../lib/flow-state.js";
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

  const PRE_SKIP_SECTIONS = /^(Status|Acceptance Criteria|User Scenarios\s*&?\s*Testing)/i;

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
  } else {
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
 * Extract exempted article titles from spec text.
 */
function extractExemptions(specText) {
  const match = specText.match(/^\s*##\s+Guardrail Exemptions\b/im);
  if (!match) return [];

  const start = match.index + match[0].length;
  const tail = specText.slice(start);
  const nextHeading = tail.match(/\n\s*##\s+/m);
  const block = nextHeading ? tail.slice(0, nextHeading.index) : tail;

  const exemptions = [];
  for (const line of block.split("\n")) {
    const m = line.match(/^\s*-\s+(.+?)(?:\s*[—–-]\s*.*)?$/);
    if (m) exemptions.push(m[1].trim().toLowerCase());
  }
  return exemptions;
}

/**
 * Build AI prompt for guardrail compliance check.
 */
function buildGuardrailPrompt(specText, articles) {
  const exemptions = extractExemptions(specText);
  const specArticles = filterByPhase(articles, "spec");
  const filteredArticles = specArticles.filter(
    (a) => !exemptions.includes(a.title.toLowerCase())
  );

  if (filteredArticles.length === 0) return null;

  const articleList = filteredArticles.map((a, i) =>
    `${i + 1}. **${a.title}**: ${a.body.trim()}`
  ).join("\n");

  const parts = [
    "You are a spec compliance checker. Check the following spec against each guardrail article.",
    "For each article, output exactly one line in this format:",
    "  PASS: <article title> — <brief reason>",
    "  FAIL: <article title> — <brief reason>",
    "",
    "Output ONLY the result lines. No preamble, no summary.",
    "",
    "## Guardrail Articles",
    articleList,
  ];

  if (exemptions.length > 0) {
    parts.push("");
    parts.push("## Exempted Articles (do NOT check these)");
    parts.push(exemptions.map((e) => `- ${e}`).join("\n"));
  }

  parts.push("");
  parts.push("## Spec");
  parts.push(specText);

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
function checkGuardrail(root, specText) {
  const articles = loadMergedArticles(root);
  if (articles.length === 0) return null;

  let config;
  try {
    config = loadConfig(root);
  } catch (_) {
    return null;
  }

  const agent = resolveAgent(config, "spec.gate");
  if (!agent) return null;

  const prompt = buildGuardrailPrompt(specText, articles);
  if (!prompt) return { passed: true, results: [] };

  const response = callAgent(agent, prompt);
  const results = parseGuardrailResponse(response);
  const passed = results.length > 0 && results.every((r) => r.passed);

  return { passed, results };
}

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
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
    const state = loadFlowState(root);
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
    const result = checkGuardrail(root, text);
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

export { main, checkSpecText, buildGuardrailPrompt, parseGuardrailResponse, checkGuardrail, extractExemptions };
runIfDirect(import.meta.url, main);

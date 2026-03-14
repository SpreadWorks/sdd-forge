#!/usr/bin/env node
/**
 * sdd-forge/spec/gate.js
 *
 * 実装開始前に spec の未解決項目を検出する。
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { translate } from "../../lib/i18n.js";
import { loadConfig, sddDir } from "../../lib/config.js";
import { callAgent, resolveAgent } from "../../lib/agent.js";
import { parseGuardrailArticles } from "./guardrail.js";
import { loadFlowState, updateStepStatus } from "../../lib/flow-state.js";

/**
 * Detect which section a line belongs to by scanning headings above it.
 * Returns the last ## heading name encountered before lineIdx.
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

  /** Sections where unchecked items are ignored in pre phase */
  const PRE_SKIP_SECTIONS = /^(Status|Acceptance Criteria|User Scenarios\s*&?\s*Testing)/i;

  const unresolvedPatterns = [
    /\[NEEDS CLARIFICATION\]/i,
    /\bTBD\b/i,
    /\bTODO\b/i,
    /\bFIXME\b/i,
  ];
  for (const [idx, line] of lines.entries()) {
    // Skip unresolved token check inside code/table cells containing example patterns
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
 * Looks for a `## Guardrail Exemptions` section with list items like:
 *   - Article Title — reason
 *
 * @param {string} specText
 * @returns {string[]} lowercased exempted article titles
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
 *
 * @param {string} specText - spec.md content
 * @param {{ title: string, body: string }[]} articles - parsed guardrail articles
 * @returns {string} prompt
 */
function buildGuardrailPrompt(specText, articles) {
  const exemptions = extractExemptions(specText);
  const filteredArticles = articles.filter(
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
 *
 * @param {string} response - AI response text
 * @returns {{ title: string, passed: boolean, reason: string }[]}
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
 *
 * @param {string} root - project root
 * @param {string} specText - spec content
 * @param {ReturnType<typeof translate>} t - i18n translator
 * @returns {{ passed: boolean, results: { title: string, passed: boolean, reason: string }[] } | null}
 *   null if skipped (no guardrail, no agent)
 */
function checkGuardrail(root, specText, t) {
  const guardrailPath = path.join(sddDir(root), "guardrail.md");
  if (!fs.existsSync(guardrailPath)) {
    console.error(t("messages:gate.guardrailWarn"));
    return null;
  }

  const guardrailText = fs.readFileSync(guardrailPath, "utf8");
  const articles = parseGuardrailArticles(guardrailText);
  if (articles.length === 0) {
    return null;
  }

  let config;
  try {
    config = loadConfig(root);
  } catch (_) {
    console.error(t("messages:gate.guardrailNoAgent"));
    return null;
  }

  const agent = resolveAgent(config);
  if (!agent) {
    console.error(t("messages:gate.guardrailNoAgent"));
    return null;
  }

  console.error(t("messages:gate.guardrailChecking"));

  const prompt = buildGuardrailPrompt(specText, articles);
  if (!prompt) {
    // All articles exempted
    return { passed: true, results: [] };
  }
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
    const tu = translate();
    const h = tu.raw("ui:help.cmdHelp.gate");
    const o = h.options;
    const pd = h.phaseDetail;
    console.log([
      h.usage, "", `  ${h.desc}`, "", "Options:",
      `  ${o.spec}`, `  ${o.phase}`,
      `    ${pd.pre}`, `    ${pd.post}`,
      `  ${o.skipGuardrail || "--skip-guardrail  Skip guardrail AI compliance check"}`,
    ].join("\n"));
    return;
  }
  if (!cli.spec) throw new Error("--spec is required");
  const specPath = path.resolve(root, cli.spec);

  if (!fs.existsSync(specPath)) {
    throw new Error(`spec not found: ${specPath}`);
  }

  const t = translate();

  const phase = cli.phase === "post" ? "post" : "pre";
  const text = fs.readFileSync(specPath, "utf8");
  const issues = checkSpecText(text, { phase });
  if (issues.length > 0) {
    console.error(t("messages:gate.failed"));
    for (const i of issues) {
      console.error(`- ${i}`);
    }
    throw new Error(t("messages:gate.failed"));
  }

  // Guardrail AI compliance check
  if (!cli.skipGuardrail) {
    const result = checkGuardrail(root, text, t);
    if (result) {
      for (const r of result.results) {
        const mark = r.passed ? "PASS" : "FAIL";
        console.error(`  ${mark}: ${r.title} — ${r.reason}`);
      }
      if (!result.passed) {
        console.error(t("messages:gate.guardrailFailed"));
        throw new Error(t("messages:gate.guardrailFailed"));
      }
      console.error(t("messages:gate.guardrailPassed"));
    }
  }

  // Update flow state if active
  try {
    const state = loadFlowState(root);
    if (state) updateStepStatus(root, "gate", "done");
  } catch (_) {}

  console.log(t("messages:gate.passed"));
}

export { main, checkSpecText, buildGuardrailPrompt, parseGuardrailResponse, checkGuardrail, extractExemptions };

runIfDirect(import.meta.url, main);

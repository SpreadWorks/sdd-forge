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
import { loadLang, sddConfigPath } from "../../lib/config.js";
import { createI18n } from "../../lib/i18n.js";

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

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    options: ["--spec", "--phase"],
    defaults: { spec: "", phase: "pre" },
  });
  if (cli.help) {
    console.log("Usage: sdd-forge gate --spec specs/NNN-name/spec.md [--phase pre|post]");
    console.log("");
    console.log("Options:");
    console.log("  --spec <path>   Path to spec.md (required)");
    console.log("  --phase <phase> Check phase: pre (default) or post");
    console.log("    pre:  Skip unchecked items in Status and Acceptance Criteria");
    console.log("    post: Check all unchecked items");
    return;
  }
  if (!cli.spec) throw new Error("--spec is required");
  const specPath = path.resolve(root, cli.spec);

  if (!fs.existsSync(specPath)) {
    throw new Error(`spec not found: ${specPath}`);
  }

  const t = createI18n(loadLang(root), { domain: "messages" });

  const phase = cli.phase === "post" ? "post" : "pre";
  const text = fs.readFileSync(specPath, "utf8");
  const issues = checkSpecText(text, { phase });
  if (issues.length > 0) {
    console.error(t("gate.failed"));
    for (const i of issues) {
      console.error(`- ${i}`);
    }
    process.exit(1);
  }

  console.log(t("gate.passed"));
}

export { main, checkSpecText };

runIfDirect(import.meta.url, main);

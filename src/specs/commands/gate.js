#!/usr/bin/env node
/**
 * sdd-forge/spec/gate.js
 *
 * 実装開始前に spec の未解決項目を検出する。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { createI18n } from "../../lib/i18n.js";

function checkSpecText(text) {
  const issues = [];
  const lines = text.split("\n");

  const unresolvedPatterns = [
    /\[NEEDS CLARIFICATION\]/i,
    /\bTBD\b/i,
    /\bTODO\b/i,
    /\bFIXME\b/i,
  ];
  for (const [idx, line] of lines.entries()) {
    for (const p of unresolvedPatterns) {
      if (p.test(line)) {
        issues.push(`line ${idx + 1}: unresolved token (${line.trim()})`);
        break;
      }
    }
    if (/^\s*-\s*\[\s\]\s+/.test(line)) {
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
    options: ["--spec"],
    defaults: { spec: "" },
  });
  if (cli.help) {
    console.log("Usage: node sdd-forge/spec/gate.js --spec specs/NNN-name/spec.md");
    return;
  }
  if (!cli.spec) throw new Error("--spec is required");
  const specPath = path.resolve(root, cli.spec);

  if (!fs.existsSync(specPath)) {
    throw new Error(`spec not found: ${specPath}`);
  }

  let uiLang = "en";
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, ".sdd-forge", "config.json"), "utf8"));
    uiLang = raw.uiLang || "en";
  } catch (_) { /* config optional */ }
  const t = createI18n(uiLang, { domain: "messages" });

  const text = fs.readFileSync(specPath, "utf8");
  const issues = checkSpecText(text);
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

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}

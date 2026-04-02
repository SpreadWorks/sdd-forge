#!/usr/bin/env node
/**
 * One-time migration script: guardrail.md → guardrail.json
 * Uses existing parseGuardrailArticles() to parse, then writes JSON.
 * Not included in npm package (outside src/).
 */

import fs from "fs";
import path from "path";
import { parseGuardrailArticles } from "../src/lib/guardrail.js";

function titleToKebab(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function lintToString(lint) {
  if (!lint) return undefined;
  if (lint instanceof RegExp) return lint.toString();
  return String(lint);
}

function convertFile(mdPath) {
  const content = fs.readFileSync(mdPath, "utf8");
  const articles = parseGuardrailArticles(content);

  const guardrails = articles.map((a) => {
    const entry = {
      id: titleToKebab(a.title),
      title: a.title,
      body: a.body.trim(),
      meta: {},
    };
    if (a.meta?.phase) entry.meta.phase = a.meta.phase;
    if (a.meta?.scope) entry.meta.scope = a.meta.scope;
    const lintStr = lintToString(a.meta?.lint);
    if (lintStr) entry.meta.lint = lintStr;
    return entry;
  });

  const jsonPath = mdPath.replace(/guardrail\.md$/, "guardrail.json");
  fs.writeFileSync(jsonPath, JSON.stringify({ guardrails }, null, 2) + "\n");
  fs.unlinkSync(mdPath);
  console.log(`  ${mdPath} → ${path.basename(jsonPath)} (${guardrails.length} guardrails)`);
}

// Find all guardrail.md files in src/presets/
const presetsDir = path.join(process.cwd(), "src/presets");
function findGuardrailFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findGuardrailFiles(full));
    } else if (entry.name === "guardrail.md") {
      results.push(full);
    }
  }
  return results;
}

const files = findGuardrailFiles(presetsDir);

// Also check .sdd-forge/guardrail.md
const projectGuardrail = path.join(process.cwd(), ".sdd-forge/guardrail.md");
if (fs.existsSync(projectGuardrail)) {
  files.push(projectGuardrail);
}

console.log(`Converting ${files.length} guardrail.md files to JSON...`);
for (const f of files) {
  convertFile(f);
}
console.log("Done.");

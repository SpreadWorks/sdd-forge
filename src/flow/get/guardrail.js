#!/usr/bin/env node
/**
 * src/flow/get/guardrail.js
 *
 * flow get guardrail <phase> — Return guardrail articles filtered by phase.
 * Moved from spec/commands/guardrail.js runShow().
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { loadMergedArticles, filterByPhase } from "../../lib/guardrail.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

const VALID_PHASES = ["draft", "spec", "impl", "lint"];

function main() {
  const root = repoRoot(import.meta.url);
  const phase = process.argv[2];

  if (!phase) {
    output(fail("get", "guardrail", "MISSING_PHASE",
      `phase required. valid: ${VALID_PHASES.join(", ")}`));
    return;
  }

  if (!VALID_PHASES.includes(phase)) {
    output(fail("get", "guardrail", "INVALID_PHASE",
      `unknown phase '${phase}'. valid: ${VALID_PHASES.join(", ")}`));
    return;
  }

  const articles = loadMergedArticles(root);
  const filtered = filterByPhase(articles, phase);

  output(ok("get", "guardrail", {
    phase,
    count: filtered.length,
    articles: filtered.map((a) => ({
      title: a.title,
      body: a.body.trim(),
      meta: a.meta,
    })),
  }));
}

export { main };
runIfDirect(import.meta.url, main);

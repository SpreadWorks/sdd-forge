#!/usr/bin/env node
/**
 * src/flow/get/guardrail.js
 *
 * flow get guardrail <phase> — Return guardrails filtered by phase.
 * Moved from spec/commands/guardrail.js runShow().
 */

import { loadMergedGuardrails, filterByPhase } from "../../lib/guardrail.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

const VALID_PHASES = ["draft", "spec", "impl", "lint"];

export async function execute(ctx) {
  const { root } = ctx;
  const args = ctx.args;
  const phase = args[0];

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

  const guardrails = loadMergedGuardrails(root);
  const filtered = filterByPhase(guardrails, phase);

  output(ok("get", "guardrail", {
    phase,
    count: filtered.length,
    guardrails: filtered.map((g) => ({
      id: g.id,
      title: g.title,
      body: g.body.trim(),
      meta: g.meta,
    })),
  }));
}

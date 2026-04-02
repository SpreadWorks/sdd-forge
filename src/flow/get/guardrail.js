#!/usr/bin/env node
/**
 * src/flow/get/guardrail.js
 *
 * flow get guardrail <phase> [--format json] — Return guardrails filtered by phase.
 * Default output is Markdown. Use --format json for JSON envelope.
 */

import { loadMergedGuardrails, filterByPhase } from "../../lib/guardrail.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

const VALID_PHASES = ["draft", "spec", "impl", "lint"];

/**
 * Parse args: extract phase (positional) and --format option.
 * @param {string[]} args
 * @returns {{ phase: string|undefined, format: string|undefined }}
 */
function parseGuardrailArgs(args) {
  let format;
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--format") {
      format = args[++i];
    } else if (!args[i].startsWith("-")) {
      positional.push(args[i]);
    }
  }
  return { phase: positional[0], format };
}

/**
 * Render guardrails as Markdown text.
 * @param {Object[]} guardrails
 * @returns {string}
 */
function toMarkdown(guardrails) {
  return guardrails
    .map((g) => `## Guardrail: ${g.title}\n\n${g.body.trim()}`)
    .join("\n\n");
}

export async function execute(ctx) {
  const { root } = ctx;
  const { phase, format } = parseGuardrailArgs(ctx.args);

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

  if (format === "json") {
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
  } else {
    console.log(toMarkdown(filtered));
  }
}

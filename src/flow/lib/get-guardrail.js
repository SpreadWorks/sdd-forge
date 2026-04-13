/**
 * src/flow/lib/get-guardrail.js
 *
 * Return guardrails filtered by phase.
 *
 * ctx.phase  — one of VALID_PHASES (see constants.js)
 * ctx.format — "json" or undefined (default: markdown string)
 */

import { loadMergedGuardrails, filterByPhase } from "../../lib/guardrail.js";
import { FlowCommand } from "./base-command.js";
import { VALID_PHASES } from "../../lib/constants.js";

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

export default class GetGuardrailCommand extends FlowCommand {
  constructor() {
    super({ requiresFlow: false });
  }

  execute(ctx) {
    const { root } = ctx;
    const { phase, format } = ctx;

    if (!phase) {
      throw new Error(`phase required. valid: ${VALID_PHASES.join(", ")}`);
    }

    if (!VALID_PHASES.includes(phase)) {
      throw new Error(`unknown phase '${phase}'. valid: ${VALID_PHASES.join(", ")}`);
    }

    const guardrails = loadMergedGuardrails(root);
    const filtered = filterByPhase(guardrails, phase);

    if (format === "json") {
      return {
        phase,
        count: filtered.length,
        guardrails: filtered.map((g) => ({
          id: g.id,
          title: g.title,
          body: g.body.trim(),
          meta: g.meta,
        })),
      };
    }

    // Default: return markdown string
    return { markdown: toMarkdown(filtered) };
  }
}

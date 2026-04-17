/**
 * src/flow/lib/set-init.js
 *
 * Initialize a preparing flow state before flow prepare.
 * Creates .sdd-forge/.active-flow.<runId> with a flow.json-compatible schema.
 * Accepts --issue and --request to seed the preparing state so that a later
 * `flow prepare --run-id <id>` can inherit them.
 */

import { FlowCommand } from "./base-command.js";

export default class SetInitCommand extends FlowCommand {
  constructor() {
    super({ requiresFlow: false });
  }

  execute(ctx) {
    const { flowManager } = ctx;

    const extra = {};
    if (ctx.issue != null && ctx.issue !== "") {
      const n = Number(ctx.issue);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`--issue must be a positive integer: ${ctx.issue}`);
      }
      extra.issue = n;
    }
    if (ctx.request) extra.request = ctx.request;

    // Conflict guard: warn if existing preparing files exist
    const existing = flowManager.listPreparingFlows();
    if (existing.length > 0) {
      console.error(
        `[flow] WARN: ${existing.length} preparing flow(s) already exist: ${existing.join(", ")}`
      );
    }

    const runId = flowManager.generateRunId();
    flowManager.createPreparingFlow(runId, extra);

    return { runId, ...extra };
  }
}

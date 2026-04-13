/**
 * src/flow/lib/set-init.js
 *
 * Initialize a preparing flow state before flow prepare.
 * Creates .sdd-forge/.active-flow.<runId> with a flow.json-compatible schema.
 */

import { FlowCommand } from "./base-command.js";
import {
  generateRunId, createPreparingFlow, listPreparingFlows,
} from "../../lib/flow-state.js";

export default class SetInitCommand extends FlowCommand {
  constructor() {
    super({ requiresFlow: false });
  }

  execute(ctx) {
    const { root } = ctx;

    // Conflict guard: warn if existing preparing files exist
    const existing = listPreparingFlows(root);
    if (existing.length > 0) {
      console.error(
        `[flow] WARN: ${existing.length} preparing flow(s) already exist: ${existing.join(", ")}`
      );
    }

    const runId = generateRunId();
    createPreparingFlow(root, runId);

    return { runId };
  }
}

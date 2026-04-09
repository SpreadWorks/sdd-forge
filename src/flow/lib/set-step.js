/**
 * src/flow/lib/set-step.js
 *
 * Update a workflow step's status.
 *
 * ctx.id     — step ID
 * ctx.status — new status string
 */

import { FlowCommand } from "./base-command.js";
import { updateStepStatus } from "../../lib/flow-state.js";
import { Logger } from "../../lib/log.js";

export default class SetStepCommand extends FlowCommand {
  execute(ctx) {
    const { id, status } = ctx;

    if (!id || !status) {
      throw new Error("usage: flow set step <id> <status>");
    }

    updateStepStatus(ctx.root, id, status);
    Logger.getInstance().event("flow-step-change", { step: id, status });

    return { id, status };
  }
}

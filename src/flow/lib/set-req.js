/**
 * src/flow/lib/set-req.js
 *
 * Update a single requirement's status.
 *
 * ctx.index  — requirement index (string or number)
 * ctx.status — new status string
 */

import { FlowCommand } from "./base-command.js";
import { updateRequirement } from "../../lib/flow-state.js";

export default class SetReqCommand extends FlowCommand {
  execute(ctx) {
    const { index: rawIndex, status } = ctx;

    if (rawIndex == null || !status) {
      throw new Error("usage: flow set req <index> <status>");
    }

    const index = parseInt(rawIndex, 10);
    if (Number.isNaN(index)) {
      throw new Error(`not a valid number: ${rawIndex}`);
    }

    updateRequirement(ctx.root, index, status);

    return { index, status };
  }
}

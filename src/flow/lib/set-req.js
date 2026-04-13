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
import { VALID_REQ_STATUSES } from "../../lib/constants.js";

export default class SetReqCommand extends FlowCommand {
  execute(ctx) {
    const { index: rawIndex, status } = ctx;

    if (rawIndex == null || !status) {
      throw new Error("usage: flow set req <index> <status>");
    }

    const str = String(rawIndex);
    if (!/^\d+$/.test(str)) {
      throw new Error(`not a valid non-negative integer: ${rawIndex}`);
    }

    const index = parseInt(str, 10);

    if (!VALID_REQ_STATUSES.includes(status)) {
      throw new Error(`invalid status: ${status} (valid: ${VALID_REQ_STATUSES.join(", ")})`);
    }

    updateRequirement(ctx.root, index, status);

    return { index, status };
  }
}

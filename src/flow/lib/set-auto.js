/**
 * src/flow/lib/set-auto.js
 *
 * Enable or disable autoApprove mode in flow.json.
 *
 * ctx.value — "on" | "off"
 */

import { FlowCommand } from "./base-command.js";
import { mutateFlowState } from "../../lib/flow-state.js";

export default class SetAutoCommand extends FlowCommand {
  execute(ctx) {
    const value = ctx.value;

    if (!value || (value !== "on" && value !== "off")) {
      throw new Error('usage: flow set auto on|off');
    }

    const autoApprove = value === "on";

    mutateFlowState(ctx.root, (state) => {
      state.autoApprove = autoApprove;
    });

    return { autoApprove };
  }
}

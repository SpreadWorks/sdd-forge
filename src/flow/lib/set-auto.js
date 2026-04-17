/**
 * src/flow/lib/set-auto.js
 *
 * Enable or disable autoApprove mode in flow.json.
 *
 * ctx.value — "on" | "off"
 */

import { FlowCommand } from "./base-command.js";
import { VALID_AUTO_VALUES } from "../../lib/constants.js";

export default class SetAutoCommand extends FlowCommand {
  execute(ctx) {
    const value = ctx.value;

    if (!value || !VALID_AUTO_VALUES.includes(value)) {
      throw new Error(`usage: flow set auto ${VALID_AUTO_VALUES.join("|")}`);
    }

    const autoApprove = value === "on";

    ctx.flowManager.mutate((state) => {
      state.autoApprove = autoApprove;
    });

    return { autoApprove };
  }
}

/**
 * src/flow/set/auto.js
 *
 * flow set auto on|off — Enable or disable autoApprove mode in flow.json.
 */

import { mutateFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

export async function execute(ctx) {
  const value = ctx.args[0];

  if (!value || (value !== "on" && value !== "off")) {
    output(fail("set", "auto", "MISSING_ARGS", 'usage: flow set auto on|off'));
    return;
  }

  const { root } = ctx;
  const autoApprove = value === "on";

  try {
    mutateFlowState(root, (state) => {
      state.autoApprove = autoApprove;
    });
    output(ok("set", "auto", { autoApprove }));
  } catch (e) {
    output(fail("set", "auto", "SET_FAILED", e.message));
  }
}

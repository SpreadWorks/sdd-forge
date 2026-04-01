/**
 * src/flow/set/step.js
 *
 * flow set step <id> <status> — Update a workflow step's status.
 */

import { updateStepStatus } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

export async function execute(ctx) {
  const args = ctx.args;
  const id = args[0];
  const status = args[1];

  if (!id || !status) {
    output(fail("set", "step", "MISSING_ARGS", "usage: flow set step <id> <status>"));
    return;
  }

  const { root } = ctx;

  try {
    updateStepStatus(root, id, status);
    output(ok("set", "step", { id, status }));
  } catch (e) {
    output(fail("set", "step", "INVALID_STEP", e.message));
  }
}

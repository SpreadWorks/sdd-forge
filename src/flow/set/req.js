/**
 * src/flow/set/req.js
 *
 * flow set req <index> <status> — Update a single requirement's status.
 */

import { updateRequirement } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

export async function execute(ctx) {
  const args = ctx.args;
  const rawIndex = args[0];
  const status = args[1];

  if (!rawIndex || !status) {
    output(fail("set", "req", "MISSING_ARGS", "usage: flow set req <index> <status>"));
    return;
  }

  const index = parseInt(rawIndex, 10);
  if (Number.isNaN(index)) {
    output(fail("set", "req", "INVALID_INDEX", `not a valid number: ${rawIndex}`));
    return;
  }

  const { root } = ctx;

  try {
    updateRequirement(root, index, status);
    output(ok("set", "req", { index, status }));
  } catch (e) {
    output(fail("set", "req", "SET_FAILED", e.message));
  }
}

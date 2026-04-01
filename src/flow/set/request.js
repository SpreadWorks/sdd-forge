/**
 * src/flow/set/request.js
 *
 * flow set request "<text>" — Set the user request field in flow.json.
 */

import { setRequest } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

export async function execute(ctx) {
  const args = ctx.args;
  const text = args[0];

  if (!text) {
    output(fail("set", "request", "MISSING_ARGS", "usage: flow set request \"<text>\""));
    return;
  }

  const { root } = ctx;

  try {
    setRequest(root, text);
    output(ok("set", "request", { request: text }));
  } catch (e) {
    output(fail("set", "request", "SET_FAILED", e.message));
  }
}

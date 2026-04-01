/**
 * src/flow/set/summary.js
 *
 * flow set summary '<json-array>' — Set requirements list from a JSON string array.
 */

import { setRequirements } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

export async function execute(ctx) {
  const args = ctx.args;
  const raw = args[0];

  if (!raw) {
    output(fail("set", "summary", "MISSING_ARGS", "usage: flow set summary '<json-array>'"));
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    output(fail("set", "summary", "INVALID_JSON", `failed to parse JSON: ${e.message}`));
    return;
  }

  if (!Array.isArray(parsed)) {
    output(fail("set", "summary", "INVALID_FORMAT", "expected a JSON array of strings"));
    return;
  }

  const { root } = ctx;

  try {
    setRequirements(root, parsed);
    output(ok("set", "summary", { count: parsed.length }));
  } catch (e) {
    output(fail("set", "summary", "SET_FAILED", e.message));
  }
}

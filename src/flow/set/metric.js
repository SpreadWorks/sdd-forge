/**
 * src/flow/set/metric.js
 *
 * flow set metric <phase> <counter> — Increment a metric counter in flow.json.
 */

import { mutateFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

const VALID_PHASES = ["draft", "spec", "gate", "test", "impl"];
const VALID_COUNTERS = ["question", "issueLog", "docsRead", "srcRead"];

export async function execute(ctx) {
  const args = ctx.args;
  const phase = args[0];
  const counter = args[1];

  if (!phase || !counter) {
    output(fail("set", "metric", "MISSING_ARGS", "usage: flow set metric <phase> <counter>"));
    return;
  }

  if (!VALID_PHASES.includes(phase)) {
    output(fail("set", "metric", "INVALID_PHASE", `invalid phase: ${phase} (valid: ${VALID_PHASES.join(", ")})`));
    return;
  }

  if (!VALID_COUNTERS.includes(counter)) {
    output(fail("set", "metric", "INVALID_COUNTER", `invalid counter: ${counter} (valid: ${VALID_COUNTERS.join(", ")})`));
    return;
  }

  const { root } = ctx;

  try {
    let newValue;
    mutateFlowState(root, (state) => {
      if (!state.metrics) state.metrics = {};
      if (!state.metrics[phase]) state.metrics[phase] = {};
      const current = state.metrics[phase][counter] || 0;
      state.metrics[phase][counter] = current + 1;
      newValue = state.metrics[phase][counter];
    });
    output(ok("set", "metric", { phase, counter, value: newValue }));
  } catch (e) {
    output(fail("set", "metric", "SET_FAILED", e.message));
  }
}

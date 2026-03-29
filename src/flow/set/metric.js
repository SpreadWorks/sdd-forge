#!/usr/bin/env node
/**
 * src/flow/set/metric.js
 *
 * flow set metric <phase> <counter> — Increment a metric counter in flow.json.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { mutateFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

const VALID_PHASES = ["draft", "spec", "gate", "test"];
const VALID_COUNTERS = ["question", "redo", "docsRead", "srcRead"];

function main() {
  const args = process.argv.slice(2);
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

  const root = repoRoot(import.meta.url);

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

export { main };
runIfDirect(import.meta.url, main);

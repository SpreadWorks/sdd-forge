/**
 * src/flow/lib/set-metric.js
 *
 * Increment a metric counter in flow.json.
 *
 * ctx.phase   — one of VALID_PHASES (see phases.js)
 * ctx.counter — one of: question, redo, docsRead, srcRead
 */

import { FlowCommand } from "./base-command.js";
import { mutateFlowState } from "../../lib/flow-state.js";
import { VALID_PHASES } from "./phases.js";
const VALID_COUNTERS = ["question", "redo", "docsRead", "srcRead"];

export default class SetMetricCommand extends FlowCommand {
  execute(ctx) {
    const { phase, counter } = ctx;

    if (!phase || !counter) {
      throw new Error("usage: flow set metric <phase> <counter>");
    }

    if (!VALID_PHASES.includes(phase)) {
      throw new Error(`invalid phase: ${phase} (valid: ${VALID_PHASES.join(", ")})`);
    }

    if (!VALID_COUNTERS.includes(counter)) {
      throw new Error(`invalid counter: ${counter} (valid: ${VALID_COUNTERS.join(", ")})`);
    }

    let newValue;
    mutateFlowState(ctx.root, (state) => {
      if (!state.metrics) state.metrics = {};
      if (!state.metrics[phase]) state.metrics[phase] = {};
      const current = state.metrics[phase][counter] || 0;
      state.metrics[phase][counter] = current + 1;
      newValue = state.metrics[phase][counter];
    });

    return { phase, counter, value: newValue };
  }
}

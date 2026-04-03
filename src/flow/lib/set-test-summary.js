/**
 * src/flow/lib/set-test-summary.js
 *
 * Save test type counts to flow.json under test.summary.
 *
 * ctx.unit        — number of unit tests (optional, string or number)
 * ctx.integration — number of integration tests (optional, string or number)
 * ctx.acceptance  — number of acceptance tests (optional, string or number)
 */

import { FlowCommand } from "./base-command.js";
import { setTestSummary } from "../../lib/flow-state.js";

const TYPE_KEYS = ["unit", "integration", "acceptance"];

export default class SetTestSummaryCommand extends FlowCommand {
  execute(ctx) {
    const summary = {};

    for (const key of TYPE_KEYS) {
      const val = ctx[key];
      if (val != null && val !== "") {
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 0) {
          throw new Error(`invalid value for --${key}: ${val}`);
        }
        summary[key] = num;
      }
    }

    if (Object.keys(summary).length === 0) {
      throw new Error("usage: flow set test-summary --unit N [--integration N] [--acceptance N]");
    }

    setTestSummary(ctx.root, summary);

    return { summary };
  }
}

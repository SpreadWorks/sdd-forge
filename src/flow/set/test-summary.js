/**
 * src/flow/set/test-summary.js
 *
 * flow set test-summary --unit N --integration N --acceptance N
 * Save test type counts to flow.json under test.summary.
 */

import { parseArgs } from "../../lib/cli.js";
import { setTestSummary } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

const TYPE_FLAGS = ["--unit", "--integration", "--acceptance"];

export async function execute(ctx) {
  const cli = parseArgs(ctx.args, {
    options: TYPE_FLAGS,
    defaults: { unit: null, integration: null, acceptance: null },
  });

  if (cli.help) {
    console.log([
      "Usage: sdd-forge flow set test-summary [options]",
      "",
      "Options:",
      "  --unit N          Number of unit tests",
      "  --integration N   Number of integration tests",
      "  --acceptance N    Number of acceptance tests",
    ].join("\n"));
    return;
  }

  const summary = {};
  for (const flag of TYPE_FLAGS) {
    const key = flag.slice(2);
    const val = cli[key];
    if (val != null && val !== "") {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0) {
        output(fail("set", "test-summary", "INVALID_VALUE", `invalid value for ${flag}: ${val}`));
        return;
      }
      summary[key] = num;
    }
  }

  if (Object.keys(summary).length === 0) {
    output(fail("set", "test-summary", "MISSING_ARGS", "usage: flow set test-summary --unit N [--integration N] [--acceptance N]"));
    return;
  }

  try {
    setTestSummary(ctx.root, summary);
    output(ok("set", "test-summary", { summary }));
  } catch (e) {
    output(fail("set", "test-summary", "SET_FAILED", e.message));
  }
}

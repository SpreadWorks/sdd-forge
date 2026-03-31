#!/usr/bin/env node
/**
 * src/flow/set/step.js
 *
 * flow set step <id> <status> — Update a workflow step's status.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { updateStepStatus } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const args = process.argv.slice(2);
  const id = args[0];
  const status = args[1];

  if (!id || !status) {
    output(fail("set", "step", "MISSING_ARGS", "usage: flow set step <id> <status>"));
    return;
  }

  const root = repoRoot(import.meta.url);

  try {
    updateStepStatus(root, id, status);
    output(ok("set", "step", { id, status }));
  } catch (e) {
    output(fail("set", "step", "INVALID_STEP", e.message));
  }
}

export { main };
runIfDirect(import.meta.url, main);

#!/usr/bin/env node
/**
 * src/flow/get/qa-count.js
 *
 * flow get qa-count — Return the number of answered questions in draft phase.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const root = repoRoot(import.meta.url);
  const state = loadFlowState(root);

  if (!state) {
    output(fail("get", "qa-count", "NO_FLOW", "no active flow (flow.json not found)"));
    return;
  }

  const count = state.metrics?.draft?.question || 0;

  output(ok("get", "qa-count", { count }));
}

export { main };
runIfDirect(import.meta.url, main);

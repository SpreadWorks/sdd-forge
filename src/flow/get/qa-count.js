#!/usr/bin/env node
/**
 * src/flow/get/qa-count.js
 *
 * flow get qa-count — Return the number of answered questions in draft phase.
 */

import { ok, fail, output } from "../../lib/flow-envelope.js";

export async function execute(ctx) {
  const state = ctx.flowState;

  if (!state) {
    output(fail("get", "qa-count", "NO_FLOW", "no active flow (flow.json not found)"));
    return;
  }

  const count = state.metrics?.draft?.question || 0;

  output(ok("get", "qa-count", { count }));
}

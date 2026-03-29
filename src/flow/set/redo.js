#!/usr/bin/env node
/**
 * src/flow/set/redo.js
 *
 * flow set redo --step X --reason Y [--trigger Z] [--resolution W] [--guardrail-candidate G]
 * Record a redo entry in the flow.json redo array.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { mutateFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const args = process.argv.slice(2);

  let opts;
  try {
    opts = parseArgs(args, {
      options: ["--step", "--reason", "--trigger", "--resolution", "--guardrail-candidate"],
    });
  } catch (e) {
    output(fail("set", "redo", "INVALID_ARGS", e.message));
    return;
  }

  if (opts.help) {
    console.log("Usage: flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]");
    process.exit(0);
    return;
  }

  if (!opts.step || !opts.reason) {
    output(fail("set", "redo", "MISSING_ARGS", "--step and --reason are required"));
    return;
  }

  const entry = {
    step: opts.step,
    reason: opts.reason,
    ...(opts.trigger && { trigger: opts.trigger }),
    ...(opts.resolution && { resolution: opts.resolution }),
    ...(opts.guardrailCandidate && { guardrailCandidate: opts.guardrailCandidate }),
    timestamp: new Date().toISOString(),
  };

  const root = repoRoot(import.meta.url);

  try {
    mutateFlowState(root, (state) => {
      if (!state.redo) state.redo = [];
      state.redo.push(entry);
    });
    output(ok("set", "redo", { entry }));
  } catch (e) {
    output(fail("set", "redo", "SET_FAILED", e.message));
  }
}

export { main };
runIfDirect(import.meta.url, main);

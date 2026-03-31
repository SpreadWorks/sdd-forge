#!/usr/bin/env node
/**
 * src/flow/set/auto.js
 *
 * flow set auto on|off — Enable or disable autoApprove mode in flow.json.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { mutateFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const value = process.argv[2];

  if (!value || (value !== "on" && value !== "off")) {
    output(fail("set", "auto", "MISSING_ARGS", 'usage: flow set auto on|off'));
    return;
  }

  const root = repoRoot(import.meta.url);
  const autoApprove = value === "on";

  try {
    mutateFlowState(root, (state) => {
      state.autoApprove = autoApprove;
    });
    output(ok("set", "auto", { autoApprove }));
  } catch (e) {
    output(fail("set", "auto", "SET_FAILED", e.message));
  }
}

export { main };
runIfDirect(import.meta.url, main);

#!/usr/bin/env node
/**
 * src/flow/set/request.js
 *
 * flow set request "<text>" — Set the user request field in flow.json.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { setRequest } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const args = process.argv.slice(2);
  const text = args[0];

  if (!text) {
    output(fail("set", "request", "MISSING_ARGS", "usage: flow set request \"<text>\""));
    return;
  }

  const root = repoRoot(import.meta.url);

  try {
    setRequest(root, text);
    output(ok("set", "request", { request: text }));
  } catch (e) {
    output(fail("set", "request", "SET_FAILED", e.message));
  }
}

export { main };
runIfDirect(import.meta.url, main);

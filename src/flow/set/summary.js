#!/usr/bin/env node
/**
 * src/flow/set/summary.js
 *
 * flow set summary '<json-array>' — Set requirements list from a JSON string array.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { setRequirements } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const args = process.argv.slice(2);
  const raw = args[0];

  if (!raw) {
    output(fail("set", "summary", "MISSING_ARGS", "usage: flow set summary '<json-array>'"));
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    output(fail("set", "summary", "INVALID_JSON", `failed to parse JSON: ${e.message}`));
    return;
  }

  if (!Array.isArray(parsed)) {
    output(fail("set", "summary", "INVALID_FORMAT", "expected a JSON array of strings"));
    return;
  }

  const root = repoRoot(import.meta.url);

  try {
    setRequirements(root, parsed);
    output(ok("set", "summary", { count: parsed.length }));
  } catch (e) {
    output(fail("set", "summary", "SET_FAILED", e.message));
  }
}

export { main };
runIfDirect(import.meta.url, main);

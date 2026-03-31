#!/usr/bin/env node
/**
 * src/flow/set/issue.js
 *
 * flow set issue <number> — Set the GitHub issue number in flow.json.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { setIssue } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const args = process.argv.slice(2);
  const raw = args[0];

  if (!raw) {
    output(fail("set", "issue", "MISSING_ARGS", "usage: flow set issue <number>"));
    return;
  }

  const num = parseInt(raw, 10);
  if (Number.isNaN(num)) {
    output(fail("set", "issue", "INVALID_ISSUE", `not a valid number: ${raw}`));
    return;
  }

  const root = repoRoot(import.meta.url);

  try {
    setIssue(root, num);
    output(ok("set", "issue", { issue: num }));
  } catch (e) {
    output(fail("set", "issue", "SET_FAILED", e.message));
  }
}

export { main };
runIfDirect(import.meta.url, main);

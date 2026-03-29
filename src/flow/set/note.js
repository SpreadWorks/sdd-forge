#!/usr/bin/env node
/**
 * src/flow/set/note.js
 *
 * flow set note "<text>" — Append a note to the notes array in flow.json.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { addNote } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const args = process.argv.slice(2);
  const text = args[0];

  if (!text) {
    output(fail("set", "note", "MISSING_ARGS", "usage: flow set note \"<text>\""));
    return;
  }

  const root = repoRoot(import.meta.url);

  try {
    addNote(root, text);
    output(ok("set", "note", { note: text }));
  } catch (e) {
    output(fail("set", "note", "SET_FAILED", e.message));
  }
}

export { main };
runIfDirect(import.meta.url, main);

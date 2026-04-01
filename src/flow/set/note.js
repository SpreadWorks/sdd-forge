/**
 * src/flow/set/note.js
 *
 * flow set note "<text>" — Append a note to the notes array in flow.json.
 */

import { addNote } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

export async function execute(ctx) {
  const args = ctx.args;
  const text = args[0];

  if (!text) {
    output(fail("set", "note", "MISSING_ARGS", "usage: flow set note \"<text>\""));
    return;
  }

  const { root } = ctx;

  try {
    addNote(root, text);
    output(ok("set", "note", { note: text }));
  } catch (e) {
    output(fail("set", "note", "SET_FAILED", e.message));
  }
}

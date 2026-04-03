/**
 * src/flow/lib/set-note.js
 *
 * Append a note to the notes array in flow.json.
 *
 * ctx.text — note text
 */

import { FlowCommand } from "./base-command.js";
import { addNote } from "../../lib/flow-state.js";

export default class SetNoteCommand extends FlowCommand {
  execute(ctx) {
    const { text } = ctx;

    if (!text) {
      throw new Error('usage: flow set note "<text>"');
    }

    addNote(ctx.root, text);

    return { note: text };
  }
}

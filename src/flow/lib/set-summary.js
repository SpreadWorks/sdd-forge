/**
 * src/flow/lib/set-summary.js
 *
 * Set requirements list from a JSON string array.
 *
 * ctx.json — JSON string representing an array of requirement strings
 */

import { FlowCommand } from "./base-command.js";
import { setRequirements } from "../../lib/flow-state.js";

export default class SetSummaryCommand extends FlowCommand {
  execute(ctx) {
    const raw = ctx.json;

    if (!raw) {
      throw new Error("usage: flow set summary '<json-array>'");
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error(`failed to parse JSON: ${e.message}`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error("expected a JSON array of strings or {text, status} objects");
    }

    for (let i = 0; i < parsed.length; i++) {
      const el = parsed[i];
      const isString = typeof el === "string";
      const isValidObject = typeof el === "object" && el !== null && !Array.isArray(el) && typeof el.text === "string";
      if (!isString && !isValidObject) {
        throw new Error(`invalid element at index ${i}: expected string or {text, status} object`);
      }
    }

    setRequirements(ctx.root, parsed);

    return { count: parsed.length };
  }
}

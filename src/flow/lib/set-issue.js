/**
 * src/flow/lib/set-issue.js
 *
 * Set the GitHub issue number in flow.json.
 *
 * ctx.number — issue number (string or number)
 */

import { FlowCommand } from "./base-command.js";
import { setIssue } from "../../lib/flow-state.js";

export default class SetIssueCommand extends FlowCommand {
  execute(ctx) {
    const raw = ctx.number;

    if (raw == null || raw === "") {
      throw new Error("usage: flow set issue <number>");
    }

    const str = String(raw);
    if (!/^\d+$/.test(str)) {
      throw new Error(`not a valid positive integer: ${raw}`);
    }

    const num = parseInt(str, 10);
    if (num < 1) {
      throw new Error(`issue number must be a positive integer: ${raw}`);
    }

    setIssue(ctx.root, num);

    return { issue: num };
  }
}

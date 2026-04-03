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

    const num = parseInt(raw, 10);
    if (Number.isNaN(num)) {
      throw new Error(`not a valid number: ${raw}`);
    }

    setIssue(ctx.root, num);

    return { issue: num };
  }
}

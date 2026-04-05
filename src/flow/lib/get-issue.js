/**
 * src/flow/lib/get-issue.js
 *
 * Get GitHub issue content.
 *
 * ctx.number — issue number (string or number)
 */

import { runCmd, formatError } from "../../lib/process.js";
import { FlowCommand } from "./base-command.js";

export default class GetIssueCommand extends FlowCommand {
  constructor() {
    super({ requiresFlow: false });
  }

  execute(ctx) {
    const { root } = ctx;
    const number = String(ctx.number ?? "");

    if (!number || !/^\d+$/.test(number)) {
      throw new Error("issue number required (positive integer)");
    }

    const res = runCmd(
      "gh",
      ["issue", "view", number, "--json", "title,body,labels,state"],
      { cwd: root, timeout: 15000 },
    );
    if (!res.ok) {
      throw new Error("failed to fetch issue: " + formatError(res));
    }
    const data = JSON.parse(res.stdout);
    return {
      number: Number(number),
      title: data.title,
      body: data.body,
      labels: data.labels,
      state: data.state,
    };
  }
}

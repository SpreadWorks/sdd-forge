/**
 * src/flow/lib/get-issue.js
 *
 * Get GitHub issue content.
 *
 * ctx.number — issue number (string or number)
 */

import { execFileSync } from "child_process";
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

    try {
      const raw = execFileSync(
        "gh",
        ["issue", "view", number, "--json", "title,body,labels,state"],
        { cwd: root, encoding: "utf8", timeout: 15000 },
      );
      const data = JSON.parse(raw);
      return {
        number: Number(number),
        title: data.title,
        body: data.body,
        labels: data.labels,
        state: data.state,
      };
    } catch (e) {
      throw new Error(e.message);
    }
  }
}

/**
 * src/flow/lib/set-request.js
 *
 * Set the user request field in flow.json.
 *
 * ctx.text — request text
 */

import { FlowCommand } from "./base-command.js";
import { setRequest } from "../../lib/flow-state.js";

export default class SetRequestCommand extends FlowCommand {
  execute(ctx) {
    const { text } = ctx;

    if (!text) {
      throw new Error('usage: flow set request "<text>"');
    }

    setRequest(ctx.root, text);

    return { request: text };
  }
}

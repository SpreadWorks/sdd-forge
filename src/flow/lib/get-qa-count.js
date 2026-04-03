/**
 * src/flow/lib/get-qa-count.js
 *
 * Return the number of answered questions in draft phase.
 */

import { FlowCommand } from "./base-command.js";

export default class GetQaCountCommand extends FlowCommand {
  execute(ctx) {
    const state = ctx.flowState;
    const count = state.metrics?.draft?.question || 0;

    return { count };
  }
}

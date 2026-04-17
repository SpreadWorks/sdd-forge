/**
 * src/flow/lib/flow-context.js
 *
 * Pure function that assembles flow-specific context fields from the shared
 * dependency container. Replaces the former resolveCtx() in src/flow.js.
 */

import { specIdFromPath } from "../../lib/flow-state.js";

export function resolveFlowContext(container) {
  const flowState = container.get("flowState");
  const paths = container.get("paths");
  return {
    root: paths.root,
    mainRoot: container.get("mainRoot"),
    config: container.get("config"),
    flowState,
    specId: flowState ? specIdFromPath(flowState.spec) : null,
    inWorktree: container.get("inWorktree"),
  };
}

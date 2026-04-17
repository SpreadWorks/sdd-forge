/**
 * src/flow/lib/flow-context.js
 *
 * Pure function that assembles flow-specific context fields from the shared
 * dependency container. Replaces the former resolveCtx() in src/flow.js.
 */

import { specIdFromPath } from "../../lib/flow-helpers.js";

export function resolveFlowContext(container) {
  const paths = container.get("paths");
  const flowManager = container.get("flowManager");
  const flowState = flowManager.load();
  return {
    root: paths.root,
    mainRoot: container.get("mainRoot"),
    config: container.get("config"),
    flowManager,
    flowState,
    specId: flowState ? specIdFromPath(flowState.spec) : null,
    inWorktree: container.get("inWorktree"),
  };
}

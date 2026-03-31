#!/usr/bin/env node
/**
 * src/flow/get/status.js
 *
 * flow get status — Return current flow state as JSON envelope.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { loadFlowState, derivePhase } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const root = repoRoot(import.meta.url);
  const state = loadFlowState(root);

  if (!state) {
    output(fail("get", "status", "NO_FLOW", "no active flow (flow.json not found)"));
    return;
  }

  const phase = state.steps ? derivePhase(state.steps) : null;
  const doneSteps = state.steps ? state.steps.filter((s) => s.status === "done").length : 0;
  const totalSteps = state.steps ? state.steps.length : 0;
  const doneReqs = state.requirements ? state.requirements.filter((r) => r.status === "done").length : 0;
  const totalReqs = state.requirements ? state.requirements.length : 0;

  output(ok("get", "status", {
    spec: state.spec,
    baseBranch: state.baseBranch,
    featureBranch: state.featureBranch,
    worktree: state.worktree || false,
    issue: state.issue || null,
    phase,
    steps: state.steps || [],
    stepsProgress: { done: doneSteps, total: totalSteps },
    requirements: state.requirements || [],
    requirementsProgress: { done: doneReqs, total: totalReqs },
    request: state.request || null,
    notes: state.notes || [],
    metrics: state.metrics || null,
    mergeStrategy: state.mergeStrategy || null,
    autoApprove: state.autoApprove || false,
  }));
}

export { main };
runIfDirect(import.meta.url, main);

/**
 * src/flow/lib/get-status.js
 *
 * Return current flow state summary.
 */

import { derivePhase } from "../../lib/flow-state.js";
import { FlowCommand } from "./base-command.js";

export default class GetStatusCommand extends FlowCommand {
  execute(ctx) {
    const state = ctx.flowState;

    const phase = state.steps ? derivePhase(state.steps) : null;
    const doneSteps = state.steps ? state.steps.filter((s) => s.status === "done").length : 0;
    const totalSteps = state.steps ? state.steps.length : 0;
    const doneReqs = state.requirements ? state.requirements.filter((r) => r.status === "done").length : 0;
    const totalReqs = state.requirements ? state.requirements.length : 0;

    return {
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
    };
  }
}

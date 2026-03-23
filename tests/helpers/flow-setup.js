import { saveFlowState, addActiveFlow, FLOW_STEPS } from "../../src/lib/flow-state.js";

export function makeFlowState(overrides = {}) {
  const steps = FLOW_STEPS.map((id) => ({ id, status: "pending" }));
  return {
    spec: "specs/001-test/spec.md",
    baseBranch: "main",
    featureBranch: "feature/001-test",
    steps,
    requirements: [],
    ...overrides,
  };
}

export function setupFlow(tmp, overrides = {}) {
  const state = makeFlowState(overrides);
  saveFlowState(tmp, state);
  const specId = state.spec.split("/")[1];
  const mode = state.worktree ? "worktree" : state.featureBranch === state.baseBranch ? "local" : "branch";
  addActiveFlow(tmp, specId, mode);
  return state;
}

export function setStepDone(state, ...ids) {
  for (const id of ids) {
    const step = state.steps.find((s) => s.id === id);
    if (step) step.status = "done";
  }
}

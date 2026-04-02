/**
 * src/flow/registry.js
 *
 * Single source of truth for flow subcommand metadata.
 * Each command is defined declaratively with helpKey, execute,
 * and optional pre/post/onError/finally hooks.
 *
 * Used by flow.js dispatcher and help.js.
 */

import { updateStepStatus, incrementMetric, derivePhase, loadFlowState } from "../lib/flow-state.js";

/**
 * Load flow state and derive the current phase.
 * @param {string} root
 * @returns {string|null} phase name or null
 */
function deriveActivePhase(root) {
  const state = loadFlowState(root);
  return derivePhase(state?.steps);
}

/**
 * Create a pre hook that sets a step to in_progress.
 * @param {string} stepId
 * @returns {(ctx: object) => void}
 */
/**
 * Best-effort step status update. Silently ignores errors (e.g. flow.json absent after cleanup).
 */
function tryUpdateStepStatus(root, stepId, status) {
  try { updateStepStatus(root, stepId, status); } catch {}
}

function stepPre(stepId) {
  return (ctx) => tryUpdateStepStatus(ctx.root, stepId, "in_progress");
}

/**
 * Create a post hook that sets a step status based on result.
 * @param {string} stepId
 * @param {(result: object) => string} [statusFn] - derive status from result; defaults to "done"
 * @returns {(ctx: object, result: object) => void}
 */
function stepPost(stepId, statusFn) {
  return (ctx, result) => {
    const status = statusFn ? statusFn(result) : "done";
    tryUpdateStepStatus(ctx.root, stepId, status);
  };
}

export const FLOW_COMMANDS = {
  prepare: {
    helpKey: "flow.prepare",
    requiresFlow: false,
    execute: () => import("./run/prepare-spec.js"),
  },
  get: {
    status: {
      helpKey: "flow.get.status",
      execute: () => import("./get/status.js"),
    },
    "resolve-context": {
      helpKey: "flow.get.resolve-context",
      execute: () => import("./get/resolve-context.js"),
    },
    check: {
      helpKey: "flow.get.check",
      execute: () => import("./get/check.js"),
    },
    prompt: {
      helpKey: "flow.get.prompt",
      requiresFlow: false,
      execute: () => import("./get/prompt.js"),
    },
    "qa-count": {
      helpKey: "flow.get.qa-count",
      execute: () => import("./get/qa-count.js"),
    },
    guardrail: {
      helpKey: "flow.get.guardrail",
      requiresFlow: false,
      execute: () => import("./get/guardrail.js"),
    },
    issue: {
      helpKey: "flow.get.issue",
      requiresFlow: false,
      execute: () => import("./get/issue.js"),
    },
    context: {
      helpKey: "flow.get.context",
      execute: () => import("./get/context.js"),
      post(ctx, result) {
        const phase = deriveActivePhase(ctx.root);
        if (!phase) return;

        if (result?.data?.type) {
          // File mode: result.data.type is "docs" or "src"
          incrementMetric(ctx.root, phase, result.data.type === "docs" ? "docsRead" : "srcRead");
        } else if (result?.data?.entries || result?.data?.total != null) {
          // List mode or search mode: reads analysis.json → docsRead
          incrementMetric(ctx.root, phase, "docsRead");
        }
      },
    },
  },
  set: {
    step: {
      helpKey: "flow.set.step",
      execute: () => import("./set/step.js"),
    },
    request: {
      helpKey: "flow.set.request",
      execute: () => import("./set/request.js"),
    },
    issue: {
      helpKey: "flow.set.issue",
      execute: () => import("./set/issue.js"),
    },
    note: {
      helpKey: "flow.set.note",
      execute: () => import("./set/note.js"),
    },
    summary: {
      helpKey: "flow.set.summary",
      execute: () => import("./set/summary.js"),
    },
    req: {
      helpKey: "flow.set.req",
      execute: () => import("./set/req.js"),
    },
    metric: {
      helpKey: "flow.set.metric",
      execute: () => import("./set/metric.js"),
    },
    redo: {
      helpKey: "flow.set.redo",
      execute: () => import("./set/redo.js"),
      post(ctx) {
        const phase = deriveActivePhase(ctx.root);
        if (phase) incrementMetric(ctx.root, phase, "redo");
      },
    },
    auto: {
      helpKey: "flow.set.auto",
      execute: () => import("./set/auto.js"),
    },
    "test-summary": {
      helpKey: "flow.set.test-summary",
      execute: () => import("./set/test-summary.js"),
    },
  },
  run: {
    gate: {
      helpKey: "flow.run.gate",
      pre: stepPre("gate"),
      execute: () => import("./run/gate.js"),
      post: stepPost("gate", (result) => result?.data?.result === "pass" ? "done" : "in_progress"),
    },
    review: {
      helpKey: "flow.run.review",
      pre: stepPre("review"),
      execute: () => import("./run/review.js"),
      post: stepPost("review"),
    },
    // impl-confirm is a read-only check, not the finalize action itself.
    // Step status is managed by the skill, not hooks.
    "impl-confirm": {
      helpKey: "flow.run.impl-confirm",
      execute: () => import("./run/impl-confirm.js"),
    },
    // finalize runs cleanup internally which deletes .active-flow,
    // so post hooks cannot update step status. Managed by the skill.
    finalize: {
      helpKey: "flow.run.finalize",
      execute: () => import("./run/finalize.js"),
    },
    sync: {
      helpKey: "flow.run.sync",
      requiresFlow: false,
      execute: () => import("./run/sync.js"),
    },
    // lint is a sub-task of the implement phase; it does not exclusively own the step.
    // Step status is managed by the skill, not hooks.
    lint: {
      helpKey: "flow.run.lint",
      execute: () => import("./run/lint.js"),
    },
    // retro is a post-flow analysis; it does not own the finalize step.
    retro: {
      helpKey: "flow.run.retro",
      execute: () => import("./run/retro.js"),
    },
    // report generates a work report from the current flow state.
    report: {
      helpKey: "flow.run.report",
      execute: () => import("./run/report.js"),
    },
  },
};

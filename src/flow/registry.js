/**
 * src/flow/registry.js
 *
 * Single source of truth for flow subcommand metadata.
 * Each command is defined declaratively with helpKey, execute,
 * and optional before/after hooks.
 *
 * Used by flow.js dispatcher and help.js.
 */

import { updateStepStatus } from "../lib/flow-state.js";

/**
 * Create a before hook that sets a step to in_progress.
 * @param {string} stepId
 * @returns {(ctx: object) => void}
 */
function stepBefore(stepId) {
  return (ctx) => updateStepStatus(ctx.root, stepId, "in_progress");
}

/**
 * Create an after hook that sets a step status based on result.
 * @param {string} stepId
 * @param {(result: object) => string} [statusFn] - derive status from result; defaults to "done"
 * @returns {(ctx: object, result: object) => void}
 */
function stepAfter(stepId, statusFn) {
  return (ctx, result) => {
    const status = statusFn ? statusFn(result) : "done";
    updateStepStatus(ctx.root, stepId, status);
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
    },
    auto: {
      helpKey: "flow.set.auto",
      execute: () => import("./set/auto.js"),
    },
  },
  run: {
    gate: {
      helpKey: "flow.run.gate",
      before: stepBefore("gate"),
      execute: () => import("./run/gate.js"),
      after: stepAfter("gate", (result) => result?.data?.result === "pass" ? "done" : "in_progress"),
    },
    review: {
      helpKey: "flow.run.review",
      before: stepBefore("review"),
      execute: () => import("./run/review.js"),
      after: stepAfter("review"),
    },
    "impl-confirm": {
      helpKey: "flow.run.impl-confirm",
      execute: () => import("./run/impl-confirm.js"),
    },
    finalize: {
      helpKey: "flow.run.finalize",
      execute: () => import("./run/finalize.js"),
    },
    sync: {
      helpKey: "flow.run.sync",
      requiresFlow: false,
      execute: () => import("./run/sync.js"),
    },
    lint: {
      helpKey: "flow.run.lint",
      execute: () => import("./run/lint.js"),
    },
    retro: {
      helpKey: "flow.run.retro",
      execute: () => import("./run/retro.js"),
    },
  },
};

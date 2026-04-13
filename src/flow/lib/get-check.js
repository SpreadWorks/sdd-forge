/**
 * src/flow/lib/get-check.js
 *
 * Check prerequisites for a phase.
 *
 * ctx.target — one of: impl, finalize, dirty, gh
 */

import { runCmd } from "../../lib/process.js";
import { isGhAvailable } from "../../lib/git-helpers.js";
import { VALID_CHECK_TARGETS } from "../../lib/constants.js";
import { FlowCommand } from "./base-command.js";

const PREREQS = {
  impl: ["gate", "test"],
  finalize: ["implement"],
};

function checkStepPrereqs(state, required) {
  const checks = [];
  for (const id of required) {
    const step = state.steps?.find((s) => s.id === id);
    const pass = step && (step.status === "done" || step.status === "skipped");
    checks.push({ id, pass, message: pass ? `${id}: ${step.status}` : `${id}: not completed` });
  }
  const pass = checks.every((c) => c.pass);
  const summary = pass ? "all prerequisites met" : `missing: ${checks.filter((c) => !c.pass).map((c) => c.id).join(", ")}`;
  return { pass, summary, checks };
}

function checkDirty(root) {
  const res = runCmd("git", ["status", "--short"], { cwd: root });
  if (!res.ok) {
    return { pass: false, summary: "git status failed", checks: [{ id: "dirty", pass: false, message: res.stderr }] };
  }
  const lines = res.stdout.trim().split("\n").filter(Boolean);
  const pass = lines.length === 0;
  return {
    pass,
    summary: pass ? "working tree clean" : `${lines.length} uncommitted change(s)`,
    checks: [{ id: "dirty", pass, message: pass ? "clean" : lines.join(", ") }],
  };
}

function checkGh() {
  const available = isGhAvailable();
  return {
    pass: available,
    summary: available ? "gh available" : "gh command not found",
    checks: [{ id: "gh", pass: available, message: available ? "available" : "not available" }],
  };
}

export default class GetCheckCommand extends FlowCommand {
  execute(ctx) {
    const { root } = ctx;
    const target = ctx.target;

    if (!target) {
      throw new Error(`target required. valid: ${VALID_CHECK_TARGETS.join(", ")}`);
    }

    if (!VALID_CHECK_TARGETS.includes(target)) {
      throw new Error(`unknown target '${target}'. valid: ${VALID_CHECK_TARGETS.join(", ")}`);
    }

    if (target === "dirty") {
      return checkDirty(root);
    }

    if (target === "gh") {
      return checkGh();
    }

    // impl / finalize — need flow state
    const state = ctx.flowState;
    if (!state) {
      throw new Error("no active flow (flow.json not found)");
    }

    return checkStepPrereqs(state, PREREQS[target]);
  }
}

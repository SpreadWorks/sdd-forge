/**
 * tests/unit/flow/flow-steps.test.js
 *
 * Tests for FLOW_STEPS ordering and PHASE_MAP after the plan rework.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FLOW_STEPS, PHASE_MAP } from "../../../src/lib/flow-state.js";

describe("FLOW_STEPS ordering (plan rework)", () => {
  it("has prepare-spec, draft, spec, gate, approval, test as plan steps", () => {
    const first8 = FLOW_STEPS.slice(0, 8);
    assert.deepEqual(first8, [
      "approach", "branch", "prepare-spec", "draft",
      "spec", "gate", "approval", "test",
    ]);
  });

  it("does not contain fill-spec (renamed to spec)", () => {
    assert.ok(!FLOW_STEPS.includes("fill-spec"), "fill-spec should be removed");
  });

  it("does not have spec before prepare-spec", () => {
    const prepIdx = FLOW_STEPS.indexOf("prepare-spec");
    const specIdx = FLOW_STEPS.indexOf("spec");
    assert.ok(prepIdx < specIdx, "prepare-spec should come before spec");
  });

  it("has gate before approval", () => {
    const gateIdx = FLOW_STEPS.indexOf("gate");
    const approvalIdx = FLOW_STEPS.indexOf("approval");
    assert.ok(gateIdx < approvalIdx, "gate should come before approval");
  });
});

describe("PHASE_MAP (plan rework)", () => {
  it("maps prepare-spec to plan phase", () => {
    assert.equal(PHASE_MAP["prepare-spec"], "plan");
  });

  it("maps spec to plan phase", () => {
    assert.equal(PHASE_MAP["spec"], "plan");
  });

  it("maps gate to plan phase", () => {
    assert.equal(PHASE_MAP["gate"], "plan");
  });

  it("maps approval to plan phase", () => {
    assert.equal(PHASE_MAP["approval"], "plan");
  });
});

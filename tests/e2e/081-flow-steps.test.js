import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FLOW_STEPS, PHASE_MAP } from "../../src/lib/flow-state.js";

describe("081: FLOW_STEPS includes finalize and sync steps", () => {
  it("includes push step", () => {
    assert.ok(FLOW_STEPS.includes("push"));
  });

  it("includes pr-create step", () => {
    assert.ok(FLOW_STEPS.includes("pr-create"));
  });

  it("includes pr-merge step for sync phase", () => {
    assert.ok(FLOW_STEPS.includes("pr-merge"));
  });

  it("includes sync-cleanup step", () => {
    assert.ok(FLOW_STEPS.includes("sync-cleanup"));
  });

  it("includes docs-commit step", () => {
    assert.ok(FLOW_STEPS.includes("docs-commit"));
  });

  it("maps pr-create to finalize phase", () => {
    assert.equal(PHASE_MAP["pr-create"], "finalize");
  });

  it("maps push to finalize phase", () => {
    assert.equal(PHASE_MAP["push"], "finalize");
  });

  it("maps pr-merge to sync phase", () => {
    assert.equal(PHASE_MAP["pr-merge"], "sync");
  });

  it("maps docs-commit to sync phase", () => {
    assert.equal(PHASE_MAP["docs-commit"], "sync");
  });

  it("retains existing merge step", () => {
    assert.ok(FLOW_STEPS.includes("merge"));
  });

  it("retains existing branch-cleanup step", () => {
    assert.ok(FLOW_STEPS.includes("branch-cleanup"));
  });
});

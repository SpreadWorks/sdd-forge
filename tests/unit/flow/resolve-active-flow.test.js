/**
 * tests/unit/flow/resolve-active-flow.test.js
 *
 * Tests for the resolveActiveFlow() shared helper in flow-state.js.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createTmpDir, removeTmpDir } from "../../helpers/tmp-dir.js";
import {
  saveFlowState, buildInitialSteps, addActiveFlow,
  resolveActiveFlow,
} from "../../../src/lib/flow-state.js";

describe("resolveActiveFlow", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  function setupFlow(dir, specId = "001-test") {
    const state = {
      spec: `specs/${specId}/spec.md`,
      baseBranch: "main",
      featureBranch: `feature/${specId}`,
      steps: buildInitialSteps(),
      requirements: [],
    };
    saveFlowState(dir, state);
    addActiveFlow(dir, specId, "local");
    return state;
  }

  it("returns flow from flowState when provided", () => {
    tmp = createTmpDir();
    const state = setupFlow(tmp);
    const result = resolveActiveFlow(tmp, state);
    assert.ok(result);
    assert.equal(result.specId, "001-test");
    assert.deepEqual(result.state.spec, state.spec);
  });

  it("falls back to loadActiveFlows when flowState is null", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    const result = resolveActiveFlow(tmp, null);
    assert.ok(result);
    assert.equal(result.specId, "001-test");
  });

  it("returns null when no flow exists", () => {
    tmp = createTmpDir();
    const result = resolveActiveFlow(tmp, null);
    assert.equal(result, null);
  });

  it("throws when multiple active flows exist", () => {
    tmp = createTmpDir();
    setupFlow(tmp, "001-first");
    // Add a second active flow
    const state2 = {
      spec: "specs/002-second/spec.md",
      baseBranch: "main",
      featureBranch: "feature/002-second",
      steps: buildInitialSteps(),
      requirements: [],
    };
    saveFlowState(tmp, state2);
    addActiveFlow(tmp, "002-second", "local");

    assert.throws(
      () => resolveActiveFlow(tmp, null),
      /multiple active flows/i,
    );
  });
});

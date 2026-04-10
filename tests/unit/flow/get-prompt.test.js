/**
 * tests/unit/flow/get-prompt.test.js
 *
 * Tests for `flow get prompt <kind>` — returns structured prompt data.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "child_process";
import { join } from "path";
import { createTmpDir, removeTmpDir } from "../../helpers/tmp-dir.js";
import {
  saveFlowState, buildInitialSteps, addActiveFlow,
} from "../../../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow get prompt", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  function setupFlowState(dir) {
    const specId = "001-test";
    const state = {
      spec: `specs/${specId}/spec.md`,
      baseBranch: "main",
      featureBranch: "feature/001-test",
      steps: buildInitialSteps(),
      requirements: [],
    };
    saveFlowState(dir, state);
    addActiveFlow(dir, specId, "local");
  }

  it("returns structured choices for plan.approach", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync(
      "node", [FLOW_CMD, "get", "prompt", "plan.approach"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.type, "get");
    assert.equal(envelope.key, "prompt");
    assert.equal(envelope.data.phase, "plan");
    assert.equal(envelope.data.step, "approach");
    assert.ok(Array.isArray(envelope.data.choices));
    assert.ok(envelope.data.choices.length >= 2);
    assert.ok(envelope.data.choices[0].id);
    assert.ok(envelope.data.choices[0].label);
  });

  it("returns empty choices for hybrid kind plan.draft", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync(
      "node", [FLOW_CMD, "get", "prompt", "plan.draft"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.data.phase, "plan");
    assert.equal(envelope.data.step, "draft");
    assert.deepEqual(envelope.data.choices, []);
  });

  it("returns error for unknown kind", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    try {
      execFileSync(
        "node", [FLOW_CMD, "get", "prompt", "unknown.kind"],
        { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
      );
      assert.fail("should exit non-zero");
    } catch (err) {
      const envelope = JSON.parse(err.stdout);
      assert.equal(envelope.ok, false);
      assert.equal(envelope.errors[0].level, "fatal");
    }
  });

  it("includes description field for static kinds", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync(
      "node", [FLOW_CMD, "get", "prompt", "finalize.merge-strategy"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    assert.ok(envelope.data.description);
    assert.ok(envelope.data.choices.length >= 2);
  });
});

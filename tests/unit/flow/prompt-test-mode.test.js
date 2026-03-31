/**
 * tests/unit/flow/prompt-test-mode.test.js
 *
 * Tests for plan.test-mode prompt update.
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

describe("flow get prompt plan.test-mode (reworked)", () => {
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

  it("returns 3 choices: create, skip, other", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync(
      "node", [FLOW_CMD, "get", "prompt", "plan.test-mode"],
      { encoding: "utf8", env: { ...process.env, SDD_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.data.choices.length, 3);
  });

  it("does not contain unit/e2e choices", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync(
      "node", [FLOW_CMD, "get", "prompt", "plan.test-mode"],
      { encoding: "utf8", env: { ...process.env, SDD_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    const labels = envelope.data.choices.map((c) => c.label);
    for (const label of labels) {
      assert.ok(!label.includes("ユニットテスト"), `should not contain unit test: ${label}`);
      assert.ok(!label.includes("E2E"), `should not contain E2E: ${label}`);
    }
  });
});

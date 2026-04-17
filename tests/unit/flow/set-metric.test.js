/**
 * tests/unit/flow/set-metric.test.js
 *
 * Tests for `flow set metric` — increments metrics counter in flow.json.
 */

import { describe, it, afterEach } from "node:test";
import { makeFlowManager } from "../../helpers/flow-setup.js";
import assert from "node:assert/strict";
import { execFileSync } from "child_process";
import { join } from "path";
import { createTmpDir, removeTmpDir } from "../../helpers/tmp-dir.js";
import { buildInitialSteps } from "../../../src/lib/flow-helpers.js";
const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow set metric", () => {
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
    makeFlowManager(dir).save(state);
    makeFlowManager(dir).addActiveFlow(specId, "local");
  }

  it("increments metrics counter and returns JSON envelope", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync(
      "node", [FLOW_CMD, "set", "metric", "draft", "question"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.type, "set");
    assert.equal(envelope.key, "metric");

    const loaded = makeFlowManager(tmp).load();
    assert.equal(loaded.metrics.draft.question, 1);
  });

  it("increments from existing value", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    execFileSync(
      "node", [FLOW_CMD, "set", "metric", "draft", "question"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    execFileSync(
      "node", [FLOW_CMD, "set", "metric", "draft", "question"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const loaded = makeFlowManager(tmp).load();
    assert.equal(loaded.metrics.draft.question, 2);
  });

  it("supports all phase and counter combinations", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    execFileSync(
      "node", [FLOW_CMD, "set", "metric", "spec", "docsRead"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const loaded = makeFlowManager(tmp).load();
    assert.equal(loaded.metrics.spec.docsRead, 1);
  });
});

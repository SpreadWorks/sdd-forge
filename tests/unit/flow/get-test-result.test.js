/**
 * tests/unit/flow/get-test-result.test.js
 *
 * Tests for `flow get test-result` — returns test execution evidence.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "child_process";
import { join } from "path";
import { mkdirSync, writeFileSync } from "fs";
import { createTmpDir, removeTmpDir } from "../../helpers/tmp-dir.js";
import { setupFlow, makeFlowManager } from "../../helpers/flow-setup.js";
const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow get test-result", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("returns JSON envelope with key test-result", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    const result = execFileSync(
      "node", [FLOW_CMD, "get", "test-result"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.type, "get");
    assert.equal(envelope.key, "test-result");
  });

  it("returns test summary from flow.json when set", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    makeFlowManager(tmp).setTestSummary({ unit: 3, integration: 1 });
    const result = execFileSync(
      "node", [FLOW_CMD, "get", "test-result"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    assert.equal(envelope.data.summary.unit, 3);
    assert.equal(envelope.data.summary.integration, 1);
  });

  it("returns log: null when no log file exists", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    const result = execFileSync(
      "node", [FLOW_CMD, "get", "test-result"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    assert.equal(envelope.data.log, null);
  });

  it("returns log content when log file exists", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    mkdirSync(join(tmp, ".tmp", "logs"), { recursive: true });
    writeFileSync(join(tmp, ".tmp", "logs", "test-output.log"), "3 passing\n0 failing\n");
    const result = execFileSync(
      "node", [FLOW_CMD, "get", "test-result"],
      { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
    );
    const envelope = JSON.parse(result);
    assert.ok(envelope.data.log.includes("3 passing"));
  });

  it("exits non-zero when no flow.json exists", () => {
    tmp = createTmpDir();
    try {
      execFileSync(
        "node", [FLOW_CMD, "get", "test-result"],
        { encoding: "utf8", env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp } },
      );
      assert.fail("should exit non-zero");
    } catch (err) {
      const envelope = JSON.parse(err.stdout);
      assert.equal(envelope.ok, false);
    }
  });
});

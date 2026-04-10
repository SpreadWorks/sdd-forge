/**
 * tests/unit/flow/set-issue-log.test.js
 *
 * Tests for `flow set issue-log` — records issue-log entries to issue-log.json.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { join } from "path";
import { createTmpDir, removeTmpDir } from "../../helpers/tmp-dir.js";
import {
  saveFlowState, buildInitialSteps, addActiveFlow,
} from "../../../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow set issue-log", () => {
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
    return specId;
  }

  it("creates issue-log.json in specs/<spec>/ directory", () => {
    tmp = createTmpDir();
    const specId = setupFlowState(tmp);
    execFileSync("node", [FLOW_CMD, "set", "issue-log", "--step", "draft", "--reason", "wrong scope"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    const logPath = path.join(tmp, "specs", specId, "issue-log.json");
    assert.ok(fs.existsSync(logPath), "issue-log.json should exist");
    const issueLog = JSON.parse(fs.readFileSync(logPath, "utf8"));
    assert.equal(issueLog.entries.length, 1);
    assert.equal(issueLog.entries[0].step, "draft");
    assert.equal(issueLog.entries[0].reason, "wrong scope");
  });

  it("appends to existing issue-log.json", () => {
    tmp = createTmpDir();
    const specId = setupFlowState(tmp);
    execFileSync("node", [FLOW_CMD, "set", "issue-log", "--step", "draft", "--reason", "first"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    execFileSync("node", [FLOW_CMD, "set", "issue-log", "--step", "spec", "--reason", "second"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    const logPath = path.join(tmp, "specs", specId, "issue-log.json");
    const issueLog = JSON.parse(fs.readFileSync(logPath, "utf8"));
    assert.equal(issueLog.entries.length, 2);
  });

  it("returns JSON envelope with entry and total", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync("node", [FLOW_CMD, "set", "issue-log", "--step", "gate", "--reason", "test"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.type, "set");
    assert.equal(envelope.key, "issue-log");
    assert.equal(envelope.data.entry.step, "gate");
    assert.equal(envelope.data.total, 1);
  });

  it("includes optional fields when provided", () => {
    tmp = createTmpDir();
    const specId = setupFlowState(tmp);
    execFileSync("node", [
      FLOW_CMD, "set", "issue-log",
      "--step", "draft",
      "--reason", "unclear requirement",
      "--trigger", "user correction",
      "--resolution", "added clarification",
      "--guardrail-candidate", "Always verify scope boundaries",
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    const logPath = path.join(tmp, "specs", specId, "issue-log.json");
    const issueLog = JSON.parse(fs.readFileSync(logPath, "utf8"));
    const entry = issueLog.entries[0];
    assert.equal(entry.trigger, "user correction");
    assert.equal(entry.resolution, "added clarification");
    assert.equal(entry.guardrailCandidate, "Always verify scope boundaries");
    assert.ok(entry.timestamp);
  });

  it("fails when --step is missing", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    try {
      execFileSync("node", [FLOW_CMD, "set", "issue-log", "--reason", "test"], {
        encoding: "utf8",
        env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const envelope = JSON.parse(err.stdout);
      assert.equal(envelope.ok, false);
      assert.ok(envelope.errors[0].code, "should have an error code");
    }
  });

  it("does NOT store issue-log in flow.json", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    execFileSync("node", [FLOW_CMD, "set", "issue-log", "--step", "draft", "--reason", "test"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    const flowPath = path.join(tmp, "specs", "001-test", "flow.json");
    const flow = JSON.parse(fs.readFileSync(flowPath, "utf8"));
    assert.equal(flow.issueLog, undefined, "issueLog should not be in flow.json");
  });
});

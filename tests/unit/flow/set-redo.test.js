/**
 * tests/unit/flow/set-redo.test.js
 *
 * Tests for `flow set redo` — records redo entries to redolog.json.
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

describe("flow set redo", () => {
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

  it("creates redolog.json in specs/<spec>/ directory", () => {
    tmp = createTmpDir();
    const specId = setupFlowState(tmp);
    execFileSync("node", [FLOW_CMD, "set", "redo", "--step", "draft", "--reason", "wrong scope"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const redoPath = path.join(tmp, "specs", specId, "redolog.json");
    assert.ok(fs.existsSync(redoPath), "redolog.json should exist");
    const redoLog = JSON.parse(fs.readFileSync(redoPath, "utf8"));
    assert.equal(redoLog.entries.length, 1);
    assert.equal(redoLog.entries[0].step, "draft");
    assert.equal(redoLog.entries[0].reason, "wrong scope");
  });

  it("appends to existing redolog.json", () => {
    tmp = createTmpDir();
    const specId = setupFlowState(tmp);
    execFileSync("node", [FLOW_CMD, "set", "redo", "--step", "draft", "--reason", "first"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    execFileSync("node", [FLOW_CMD, "set", "redo", "--step", "spec", "--reason", "second"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const redoPath = path.join(tmp, "specs", specId, "redolog.json");
    const redoLog = JSON.parse(fs.readFileSync(redoPath, "utf8"));
    assert.equal(redoLog.entries.length, 2);
  });

  it("returns JSON envelope with entry and total", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync("node", [FLOW_CMD, "set", "redo", "--step", "gate", "--reason", "test"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.type, "set");
    assert.equal(envelope.key, "redo");
    assert.equal(envelope.data.entry.step, "gate");
    assert.equal(envelope.data.total, 1);
  });

  it("includes optional fields when provided", () => {
    tmp = createTmpDir();
    const specId = setupFlowState(tmp);
    execFileSync("node", [
      FLOW_CMD, "set", "redo",
      "--step", "draft",
      "--reason", "unclear requirement",
      "--trigger", "user correction",
      "--resolution", "added clarification",
      "--guardrail-candidate", "Always verify scope boundaries",
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const redoPath = path.join(tmp, "specs", specId, "redolog.json");
    const redoLog = JSON.parse(fs.readFileSync(redoPath, "utf8"));
    const entry = redoLog.entries[0];
    assert.equal(entry.trigger, "user correction");
    assert.equal(entry.resolution, "added clarification");
    assert.equal(entry.guardrailCandidate, "Always verify scope boundaries");
    assert.ok(entry.timestamp);
  });

  it("fails when --step is missing", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    try {
      execFileSync("node", [FLOW_CMD, "set", "redo", "--reason", "test"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const envelope = JSON.parse(err.stdout);
      assert.equal(envelope.ok, false);
      assert.equal(envelope.errors[0].code, "MISSING_ARGS");
    }
  });

  it("does NOT store redo in flow.json", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    execFileSync("node", [FLOW_CMD, "set", "redo", "--step", "draft", "--reason", "test"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const flowPath = path.join(tmp, "specs", "001-test", "flow.json");
    const flow = JSON.parse(fs.readFileSync(flowPath, "utf8"));
    assert.equal(flow.redo, undefined, "redo should not be in flow.json");
  });
});

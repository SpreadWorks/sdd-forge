import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "node:child_process";
import { saveFlowState, loadFlowState, mutateFlowState, buildInitialSteps, addActiveFlow } from "../../../src/lib/flow-state.js";

function createTmpProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "flow-auto-"));
  fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "specs", "001-test"), { recursive: true });
  execFileSync("git", ["init", tmp], { stdio: "ignore" });
  return tmp;
}

function createFlowState(tmp) {
  const state = {
    spec: "specs/001-test/spec.md",
    baseBranch: "main",
    featureBranch: "feature/001-test",
    steps: buildInitialSteps(),
  };
  saveFlowState(tmp, state);
  addActiveFlow(tmp, "001-test", "branch");
  return state;
}

describe("flow-state autoApprove", () => {
  let tmp;

  beforeEach(() => {
    tmp = createTmpProject();
    createFlowState(tmp);
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("sets autoApprove to true via mutateFlowState", () => {
    mutateFlowState(tmp, (state) => {
      state.autoApprove = true;
    });
    const loaded = loadFlowState(tmp);
    assert.equal(loaded.autoApprove, true);
  });

  it("sets autoApprove to false via mutateFlowState", () => {
    // First set to true
    mutateFlowState(tmp, (state) => {
      state.autoApprove = true;
    });
    // Then set to false
    mutateFlowState(tmp, (state) => {
      state.autoApprove = false;
    });
    const loaded = loadFlowState(tmp);
    assert.equal(loaded.autoApprove, false);
  });

  it("autoApprove defaults to undefined when not set", () => {
    const loaded = loadFlowState(tmp);
    assert.equal(loaded.autoApprove, undefined);
  });

  it("preserves autoApprove across other mutations", () => {
    mutateFlowState(tmp, (state) => {
      state.autoApprove = true;
    });
    mutateFlowState(tmp, (state) => {
      state.request = "test request";
    });
    const loaded = loadFlowState(tmp);
    assert.equal(loaded.autoApprove, true);
    assert.equal(loaded.request, "test request");
  });
});

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "node:child_process";
import { saveFlowState, loadFlowState, buildInitialSteps, addActiveFlow } from "../../../src/lib/flow-state.js";

function createTmpProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "set-auto-"));
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
}

function runSetAuto(tmp, value) {
  const script = path.resolve("src/sdd-forge.js");
  const args = ["flow", "set", "auto"];
  if (value !== undefined) args.push(value);
  const result = execFileSync("node", [script, ...args], {
    encoding: "utf8",
    cwd: tmp,
    env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
  });
  return JSON.parse(result.trim());
}

describe("flow set auto", () => {
  let tmp;

  beforeEach(() => {
    tmp = createTmpProject();
    createFlowState(tmp);
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("sets autoApprove to true with 'on'", () => {
    const result = runSetAuto(tmp, "on");
    assert.equal(result.ok, true);
    assert.equal(result.data.autoApprove, true);

    const state = loadFlowState(tmp);
    assert.equal(state.autoApprove, true);
  });

  it("sets autoApprove to false with 'off'", () => {
    runSetAuto(tmp, "on");
    const result = runSetAuto(tmp, "off");
    assert.equal(result.ok, true);
    assert.equal(result.data.autoApprove, false);

    const state = loadFlowState(tmp);
    assert.equal(state.autoApprove, false);
  });

  it("fails without argument", () => {
    try {
      runSetAuto(tmp, undefined);
      assert.fail("should have thrown");
    } catch (e) {
      const output = JSON.parse(e.stdout.trim());
      assert.equal(output.ok, false);
    }
  });
});

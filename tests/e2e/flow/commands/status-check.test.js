import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";
import { makeFlowState, setStepDone } from "../../../helpers/flow-setup.js";
import { saveFlowState, addActiveFlow } from "../../../../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow get check impl", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("PASS when gate and test are both done", () => {
    tmp = createTmpDir();
    const state = makeFlowState();
    setStepDone(state, "gate", "test");
    saveFlowState(tmp, state);
    addActiveFlow(tmp, "001-test", "local");
    const result = execFileSync("node", [FLOW_CMD, "get", "check", "impl"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /pass.*true/is);
  });

  it("PASS when gate is done and test is skipped", () => {
    tmp = createTmpDir();
    const state = makeFlowState();
    setStepDone(state, "gate");
    state.steps.find((s) => s.id === "test").status = "skipped";
    saveFlowState(tmp, state);
    addActiveFlow(tmp, "001-test", "local");
    const result = execFileSync("node", [FLOW_CMD, "get", "check", "impl"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /pass.*true/is);
  });

  it("FAIL when gate is not done", () => {
    tmp = createTmpDir();
    const state = makeFlowState();
    setStepDone(state, "test");
    saveFlowState(tmp, state);
    addActiveFlow(tmp, "001-test", "local");
    const result = execFileSync("node", [FLOW_CMD, "get", "check", "impl"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /pass.*false/is);
    assert.match(result, /gate/);
  });

  it("FAIL when test is not done", () => {
    tmp = createTmpDir();
    const state = makeFlowState();
    setStepDone(state, "gate");
    saveFlowState(tmp, state);
    addActiveFlow(tmp, "001-test", "local");
    const result = execFileSync("node", [FLOW_CMD, "get", "check", "impl"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /pass.*false/is);
    assert.match(result, /test/);
  });

  it("errors when no flow.json exists", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "get", "check", "impl"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no.*(active )?flow/i);
    }
  });
});

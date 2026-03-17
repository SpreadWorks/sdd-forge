import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";
import { saveFlowState, FLOW_STEPS } from "../../../../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

function makeState(overrides = {}) {
  const steps = FLOW_STEPS.map((id) => ({ id, status: "pending" }));
  return {
    spec: "specs/001-test/spec.md",
    baseBranch: "main",
    featureBranch: "feature/001-test",
    steps,
    ...overrides,
  };
}

function setStepDone(state, ...ids) {
  for (const id of ids) {
    const step = state.steps.find((s) => s.id === id);
    if (step) step.status = "done";
  }
}

describe("flow status --check impl", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("PASS when gate and test are both done", () => {
    tmp = createTmpDir();
    const state = makeState();
    setStepDone(state, "gate", "test");
    saveFlowState(tmp, state);
    const result = execFileSync("node", [FLOW_CMD, "status", "--check", "impl"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /PASS/i);
  });

  it("PASS when gate is done and test is skipped", () => {
    tmp = createTmpDir();
    const state = makeState();
    setStepDone(state, "gate");
    state.steps.find((s) => s.id === "test").status = "skipped";
    saveFlowState(tmp, state);
    const result = execFileSync("node", [FLOW_CMD, "status", "--check", "impl"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /PASS/i);
  });

  it("FAIL (exit 1) when gate is not done", () => {
    tmp = createTmpDir();
    const state = makeState();
    setStepDone(state, "test");
    saveFlowState(tmp, state);
    try {
      execFileSync("node", [FLOW_CMD, "status", "--check", "impl"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /FAIL/i);
      assert.match(out, /gate/);
    }
  });

  it("FAIL (exit 1) when test is not done", () => {
    tmp = createTmpDir();
    const state = makeState();
    setStepDone(state, "gate");
    saveFlowState(tmp, state);
    try {
      execFileSync("node", [FLOW_CMD, "status", "--check", "impl"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /FAIL/i);
      assert.match(out, /test/);
    }
  });

  it("--dry-run always exits 0 even when FAIL", () => {
    tmp = createTmpDir();
    const state = makeState(); // gate and test both pending
    saveFlowState(tmp, state);
    const result = execFileSync("node", [FLOW_CMD, "status", "--check", "impl", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /FAIL/i);
  });

  it("errors when no flow.json exists", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "status", "--check", "impl"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow/i);
    }
  });
});

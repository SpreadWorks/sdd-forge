import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";
import { saveFlowState, loadFlowState, buildInitialSteps, addActiveFlow, specIdFromPath } from "../../../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/sdd-forge.js");
const FLOW_CMD_ARGS_PREFIX = ["flow"];

function setupFlowEnv(tmp) {
  // Create minimal config and flow state
  writeJson(tmp, ".sdd-forge/config.json", { lang: "js", type: "cli", docs: { languages: ["en"], defaultLanguage: "en" } });
  const specDir = "specs/999-test";
  writeFile(tmp, `${specDir}/spec.md`, "# Spec\n## Requirements\n- REQ-1\n");
  const specPath = `${specDir}/spec.md`;
  saveFlowState(tmp, {
    spec: specPath,
    baseBranch: "main",
    featureBranch: "feature/test",
    steps: buildInitialSteps(),
  });
  addActiveFlow(tmp, specIdFromPath(specPath), "branch");
  return tmp;
}

describe("flow set test-summary", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("saves test summary to flow.json under test.summary", () => {
    tmp = setupFlowEnv(createTmpDir());
    const result = execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "set", "test-summary", "--unit", "3", "--integration", "2"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    const parsed = JSON.parse(result);
    assert.equal(parsed.ok, true);
    assert.deepEqual(parsed.data.summary, { unit: 3, integration: 2 });

    const flow = loadFlowState(tmp);
    assert.deepEqual(flow.test.summary, { unit: 3, integration: 2 });
  });

  it("errors when no flags provided", () => {
    tmp = setupFlowEnv(createTmpDir());
    try {
      execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "set", "test-summary"], {
        encoding: "utf8",
        env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = err.stdout || "";
      const parsed = JSON.parse(out);
      assert.equal(parsed.ok, false);
      assert.match(parsed.errors[0].messages[0], /usage/i);
    }
  });

  it("overwrites previous test.summary", () => {
    tmp = setupFlowEnv(createTmpDir());
    execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "set", "test-summary", "--unit", "5"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "set", "test-summary", "--acceptance", "1"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    const flow = loadFlowState(tmp);
    assert.deepEqual(flow.test.summary, { acceptance: 1 });
    assert.equal(flow.test.summary.unit, undefined);
  });

  it("does not affect existing flow.json fields", () => {
    tmp = setupFlowEnv(createTmpDir());
    execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "set", "test-summary", "--unit", "2"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
    });
    const flow = loadFlowState(tmp);
    assert.ok(flow.steps, "steps preserved");
    assert.ok(flow.spec, "spec preserved");
    assert.ok(flow.baseBranch, "baseBranch preserved");
  });

  it("shows in help output", () => {
    const result = execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "set", "--help"], { encoding: "utf8" });
    assert.match(result, /test-summary/);
  });
});

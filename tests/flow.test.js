import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "./helpers/tmp-dir.js";
import { saveFlowState, loadFlowState, clearFlowState, FLOW_STEPS } from "../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow-state", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("saves and loads flow state to flow.json", () => {
    tmp = createTmpDir();
    const state = { spec: "specs/001-test/spec.md", baseBranch: "main", featureBranch: "feature/001-test" };
    saveFlowState(tmp, state);
    const loaded = loadFlowState(tmp);
    assert.deepEqual(loaded, state);
    // Verify file is named flow.json
    assert.ok(fs.existsSync(join(tmp, ".sdd-forge", "flow.json")));
  });

  it("returns null when no state exists", () => {
    tmp = createTmpDir();
    assert.equal(loadFlowState(tmp), null);
  });

  it("clears flow state", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, { spec: "x", baseBranch: "main", featureBranch: "f" });
    clearFlowState(tmp);
    assert.equal(loadFlowState(tmp), null);
  });

  it("saves and loads flow state with steps and requirements", () => {
    tmp = createTmpDir();
    const state = {
      spec: "specs/001-test/spec.md",
      baseBranch: "main",
      featureBranch: "feature/001-test",
      steps: FLOW_STEPS.map((id) => ({ id, status: "pending" })),
      requirements: [
        { desc: "implement feature A", status: "pending" },
        { desc: "implement feature B", status: "done" },
      ],
    };
    saveFlowState(tmp, state);
    const loaded = loadFlowState(tmp);
    assert.deepEqual(loaded.steps, state.steps);
    assert.deepEqual(loaded.requirements, state.requirements);
  });

  it("saves and loads flow state with worktree fields", () => {
    tmp = createTmpDir();
    const state = {
      spec: "specs/001-test/spec.md",
      baseBranch: "main",
      featureBranch: "feature/001-test",
      worktree: true,
      worktreePath: "/tmp/wt-test",
      mainRepoPath: "/tmp/main-repo",
    };
    saveFlowState(tmp, state);
    const loaded = loadFlowState(tmp);
    assert.deepEqual(loaded, state);
    assert.equal(loaded.worktree, true);
    assert.equal(loaded.worktreePath, "/tmp/wt-test");
    assert.equal(loaded.mainRepoPath, "/tmp/main-repo");
  });

  it("exports FLOW_STEPS constant with all 10 step IDs", () => {
    assert.equal(FLOW_STEPS.length, 10);
    assert.deepEqual(FLOW_STEPS, [
      "approach", "branch", "spec", "draft", "fill-spec",
      "approval", "gate", "test", "implement", "finalize",
    ]);
  });
});

describe("flow CLI dispatcher", () => {
  it("shows help with no subcommand", () => {
    try {
      execFileSync("node", [FLOW_CMD], { encoding: "utf8" });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /start|status/);
    }
  });

  it("shows help with --help", () => {
    const result = execFileSync("node", [FLOW_CMD, "--help"], { encoding: "utf8" });
    assert.match(result, /start/);
    assert.match(result, /status/);
  });
});

describe("flow start CLI", () => {
  it("exits with error when no request given", () => {
    try {
      execFileSync("node", [FLOW_CMD, "start"], { encoding: "utf8" });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /--request is required/);
    }
  });
});

describe("flow status CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  function setupFlowState(dir) {
    const state = {
      spec: "specs/001-test/spec.md",
      baseBranch: "main",
      featureBranch: "feature/001-test",
      steps: FLOW_STEPS.map((id) => ({ id, status: "pending" })),
      requirements: [],
    };
    saveFlowState(dir, state);
    return state;
  }

  it("displays flow status when no options given", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync("node", [FLOW_CMD, "status"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /approach/);
    assert.match(result, /pending/);
  });

  it("updates step status with --step and --status", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    execFileSync("node", [FLOW_CMD, "status", "--step", "gate", "--status", "done"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const loaded = loadFlowState(tmp);
    const gate = loaded.steps.find((s) => s.id === "gate");
    assert.equal(gate.status, "done");
  });

  it("saves requirements with --summary", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const summary = JSON.stringify(["implement feature A", "implement feature B"]);
    execFileSync("node", [FLOW_CMD, "status", "--summary", summary], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const loaded = loadFlowState(tmp);
    assert.equal(loaded.requirements.length, 2);
    assert.equal(loaded.requirements[0].desc, "implement feature A");
    assert.equal(loaded.requirements[0].status, "pending");
    assert.equal(loaded.requirements[1].desc, "implement feature B");
  });

  it("updates requirement status with --req and --status", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    // First set requirements
    const summary = JSON.stringify(["feat A", "feat B"]);
    execFileSync("node", [FLOW_CMD, "status", "--summary", summary], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    // Then update one
    execFileSync("node", [FLOW_CMD, "status", "--req", "0", "--status", "done"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const loaded = loadFlowState(tmp);
    assert.equal(loaded.requirements[0].status, "done");
    assert.equal(loaded.requirements[1].status, "pending");
  });

  it("reports error when no flow.json exists", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "status"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow|flow.json/i);
    }
  });
});

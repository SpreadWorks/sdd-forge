import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson } from "../helpers/tmp-dir.js";
import {
  saveFlowState, loadFlowState, clearFlowState, buildInitialSteps,
  updateStepStatus, FLOW_STEPS,
  loadActiveFlows, addActiveFlow, removeActiveFlow,
} from "../../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

// ── .active-flow pointer tests ──────────────────────────────────────────────

describe("active-flow pointer", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("loadActiveFlows returns empty array when .active-flow does not exist", () => {
    tmp = createTmpDir();
    const flows = loadActiveFlows(tmp);
    assert.deepEqual(flows, []);
  });

  it("addActiveFlow creates .active-flow with one entry", () => {
    tmp = createTmpDir();
    addActiveFlow(tmp, "086-migrate-flow-state", "worktree");
    const flows = loadActiveFlows(tmp);
    assert.equal(flows.length, 1);
    assert.equal(flows[0].spec, "086-migrate-flow-state");
    assert.equal(flows[0].mode, "worktree");
  });

  it("addActiveFlow appends to existing entries", () => {
    tmp = createTmpDir();
    addActiveFlow(tmp, "086-migrate", "worktree");
    addActiveFlow(tmp, "087-other", "branch");
    const flows = loadActiveFlows(tmp);
    assert.equal(flows.length, 2);
    assert.equal(flows[0].spec, "086-migrate");
    assert.equal(flows[1].spec, "087-other");
    assert.equal(flows[1].mode, "branch");
  });

  it("removeActiveFlow removes matching entry and keeps others", () => {
    tmp = createTmpDir();
    addActiveFlow(tmp, "086-migrate", "worktree");
    addActiveFlow(tmp, "087-other", "branch");
    removeActiveFlow(tmp, "086-migrate");
    const flows = loadActiveFlows(tmp);
    assert.equal(flows.length, 1);
    assert.equal(flows[0].spec, "087-other");
  });

  it("removeActiveFlow deletes .active-flow file when last entry is removed", () => {
    tmp = createTmpDir();
    addActiveFlow(tmp, "086-migrate", "worktree");
    removeActiveFlow(tmp, "086-migrate");
    const flows = loadActiveFlows(tmp);
    assert.deepEqual(flows, []);
    assert.ok(!fs.existsSync(join(tmp, ".sdd-forge", ".active-flow")));
  });

  it("removeActiveFlow is a no-op when spec ID does not exist", () => {
    tmp = createTmpDir();
    addActiveFlow(tmp, "086-migrate", "worktree");
    removeActiveFlow(tmp, "999-nonexistent");
    const flows = loadActiveFlows(tmp);
    assert.equal(flows.length, 1);
  });

  it(".active-flow is stored as valid JSON", () => {
    tmp = createTmpDir();
    addActiveFlow(tmp, "086-migrate", "local");
    const raw = fs.readFileSync(join(tmp, ".sdd-forge", ".active-flow"), "utf8");
    const parsed = JSON.parse(raw);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed[0].spec, "086-migrate");
    assert.equal(parsed[0].mode, "local");
  });
});

// ── flow.json storage in specs/NNN/ ─────────────────────────────────────────

describe("flow-state (specs-based storage)", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("saveFlowState writes to specs/NNN/flow.json", () => {
    tmp = createTmpDir();
    const specId = "001-test";
    const state = {
      spec: `specs/${specId}/spec.md`,
      baseBranch: "main",
      featureBranch: "feature/001-test",
    };
    saveFlowState(tmp, state);
    assert.ok(fs.existsSync(join(tmp, "specs", specId, "flow.json")));
  });

  it("saveFlowState does NOT write to .sdd-forge/flow.json", () => {
    tmp = createTmpDir();
    const state = {
      spec: "specs/001-test/spec.md",
      baseBranch: "main",
      featureBranch: "feature/001-test",
    };
    saveFlowState(tmp, state);
    assert.ok(!fs.existsSync(join(tmp, ".sdd-forge", "flow.json")));
  });

  it("loadFlowState reads from specs/NNN/flow.json via .active-flow", () => {
    tmp = createTmpDir();
    const specId = "001-test";
    const state = {
      spec: `specs/${specId}/spec.md`,
      baseBranch: "main",
      featureBranch: "feature/001-test",
    };
    // Manually set up: write flow.json + .active-flow
    const flowDir = join(tmp, "specs", specId);
    fs.mkdirSync(flowDir, { recursive: true });
    fs.writeFileSync(join(flowDir, "flow.json"), JSON.stringify(state, null, 2) + "\n");
    addActiveFlow(tmp, specId, "local");

    const loaded = loadFlowState(tmp);
    assert.deepEqual(loaded, state);
  });

  it("loadFlowState returns null when no .active-flow exists", () => {
    tmp = createTmpDir();
    assert.equal(loadFlowState(tmp), null);
  });

  it("clearFlowState removes entry from .active-flow but keeps flow.json", () => {
    tmp = createTmpDir();
    const specId = "001-test";
    const state = {
      spec: `specs/${specId}/spec.md`,
      baseBranch: "main",
      featureBranch: "feature/001-test",
    };
    saveFlowState(tmp, state);
    addActiveFlow(tmp, specId, "local");

    clearFlowState(tmp, specId);

    // .active-flow entry should be removed
    const flows = loadActiveFlows(tmp);
    assert.equal(flows.length, 0);
    // flow.json should still exist
    assert.ok(fs.existsSync(join(tmp, "specs", specId, "flow.json")));
  });
});

// ── steps and requirements ──────────────────────────────────────────────────

describe("flow-state steps and requirements", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  function setupFlow(dir) {
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

  it("FLOW_STEPS does not contain 'archive'", () => {
    assert.ok(!FLOW_STEPS.includes("archive"), "archive step should be removed");
  });

  it("buildInitialSteps creates pending entries for all steps", () => {
    const steps = buildInitialSteps();
    assert.equal(steps.length, FLOW_STEPS.length);
    for (const step of steps) {
      assert.equal(step.status, "pending");
    }
  });

  it("updateStepStatus updates the correct step", () => {
    tmp = createTmpDir();
    const specId = setupFlow(tmp);
    updateStepStatus(tmp, "gate", "done");
    const loaded = loadFlowState(tmp);
    const gate = loaded.steps.find((s) => s.id === "gate");
    assert.equal(gate.status, "done");
  });
});

// ── flow CLI dispatcher ─────────────────────────────────────────────────────

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

// ── flow status CLI ─────────────────────────────────────────────────────────

describe("flow status CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  function setupFlowState(dir) {
    const specId = "001-test";
    const state = {
      spec: `specs/${specId}/spec.md`,
      baseBranch: "main",
      featureBranch: "feature/001-test",
      steps: FLOW_STEPS.map((id) => ({ id, status: "pending" })),
      requirements: [],
    };
    saveFlowState(dir, state);
    addActiveFlow(dir, specId, "local");
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

  it("displays flow status without markdown syntax", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const result = execFileSync("node", [FLOW_CMD, "status"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.doesNotMatch(result, /^\s*\|.*\|/m);
    assert.doesNotMatch(result, /^##\s/m);
  });

  it("rejects --archive as unknown option", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    try {
      execFileSync("node", [FLOW_CMD, "status", "--archive"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /unknown|invalid|archive/i);
    }
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
  });

  it("updates requirement status with --req and --status", () => {
    tmp = createTmpDir();
    setupFlowState(tmp);
    const summary = JSON.stringify(["feat A", "feat B"]);
    execFileSync("node", [FLOW_CMD, "status", "--summary", summary], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    execFileSync("node", [FLOW_CMD, "status", "--req", "0", "--status", "done"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const loaded = loadFlowState(tmp);
    assert.equal(loaded.requirements[0].status, "done");
    assert.equal(loaded.requirements[1].status, "pending");
  });

  it("reports error when no .active-flow exists", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "status"], {
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

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeFile } from "../../../helpers/tmp-dir.js";
import { makeFlowState, setupFlow } from "../../../helpers/flow-setup.js";
import { saveFlowState, loadFlowState, addActiveFlow } from "../../../../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

function setStepStatus(state, id, status) {
  const step = state.steps.find((s) => s.id === id);
  if (step) step.status = status;
}

// ---------------------------------------------------------------------------
// setRequest / addNote (via status.js CLI)
// ---------------------------------------------------------------------------

describe("flow status --request", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("saves request to flow.json", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    execFileSync("node", [FLOW_CMD, "status", "--request", "make a resume command"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const updated = loadFlowState(tmp);
    assert.equal(updated.request, "make a resume command");
  });
});

describe("flow status --note", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("appends note to flow.json notes array", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    execFileSync("node", [FLOW_CMD, "status", "--note", "approach: draft first"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const updated = loadFlowState(tmp);
    assert.deepEqual(updated.notes, ["approach: draft first"]);
  });

  it("appends multiple notes in order", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    execFileSync("node", [FLOW_CMD, "status", "--note", "first note"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    execFileSync("node", [FLOW_CMD, "status", "--note", "second note"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const updated = loadFlowState(tmp);
    assert.deepEqual(updated.notes, ["first note", "second note"]);
  });

  it("initializes notes array when absent", () => {
    tmp = createTmpDir();
    const state = makeFlowState();
    delete state.notes;
    saveFlowState(tmp, state);
    addActiveFlow(tmp, "001-test", "local");
    execFileSync("node", [FLOW_CMD, "status", "--note", "new note"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const updated = loadFlowState(tmp);
    assert.ok(Array.isArray(updated.notes));
    assert.deepEqual(updated.notes, ["new note"]);
  });
});

// ---------------------------------------------------------------------------
// flow resume
// ---------------------------------------------------------------------------

describe("flow resume", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("outputs summary from flow.json and spec.md", () => {
    tmp = createTmpDir();
    const state = makeFlowState({
      request: "add resume command",
      notes: ["approach: draft first", "branch: main"],
    });
    setStepStatus(state, "approach", "done");
    setStepStatus(state, "branch", "done");
    setStepStatus(state, "spec", "done");
    setStepStatus(state, "draft", "in_progress");
    saveFlowState(tmp, state);
    addActiveFlow(tmp, "001-test", "local");

    // Create spec.md
    writeFile(tmp, "specs/001-test/spec.md", [
      "# Feature Specification: 001-test",
      "",
      "## Goal",
      "Add a resume command for compaction resilience.",
      "",
      "## Requirements",
      "- req 1",
      "- req 2",
    ].join("\n"));

    const result = execFileSync("node", [FLOW_CMD, "resume"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.match(result, /Flow Resume/);
    assert.match(result, /add resume command/);
    assert.match(result, /draft/);
    assert.match(result, /approach: draft first/);
    assert.match(result, /branch: main/);
  });

  it("exits 1 when no flow.json exists", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "resume"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow/i);
    }
  });

  it("handles missing request and notes gracefully", () => {
    tmp = createTmpDir();
    const state = makeFlowState();
    setStepStatus(state, "approach", "in_progress");
    saveFlowState(tmp, state);
    addActiveFlow(tmp, "001-test", "local");

    writeFile(tmp, "specs/001-test/spec.md", [
      "# Feature Specification: 001-test",
      "",
      "## Goal",
      "Test goal.",
    ].join("\n"));

    const result = execFileSync("node", [FLOW_CMD, "resume"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.match(result, /Flow Resume/);
    assert.ok(result.length > 0);
  });
});

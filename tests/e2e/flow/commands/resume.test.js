import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";
import { makeFlowState, setupFlow } from "../../../helpers/flow-setup.js";
import { saveFlowState, loadFlowState, addActiveFlow } from "../../../../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

// ---------------------------------------------------------------------------
// flow set request / flow set note
// ---------------------------------------------------------------------------

describe("flow set request", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("saves request to flow.json", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    execFileSync("node", [FLOW_CMD, "set", "request", "make a resume command"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const updated = loadFlowState(tmp);
    assert.equal(updated.request, "make a resume command");
  });
});

describe("flow set note", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("appends note to flow.json notes array", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    execFileSync("node", [FLOW_CMD, "set", "note", "approach: draft first"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const updated = loadFlowState(tmp);
    assert.deepEqual(updated.notes, ["approach: draft first"]);
  });

  it("appends multiple notes in order", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    execFileSync("node", [FLOW_CMD, "set", "note", "first note"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    execFileSync("node", [FLOW_CMD, "set", "note", "second note"], {
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
    execFileSync("node", [FLOW_CMD, "set", "note", "new note"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    const updated = loadFlowState(tmp);
    assert.ok(Array.isArray(updated.notes));
    assert.deepEqual(updated.notes, ["new note"]);
  });
});

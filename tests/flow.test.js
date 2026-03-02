import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "./helpers/tmp-dir.js";
import { saveFlowState, loadFlowState, clearFlowState } from "../src/lib/flow-state.js";

const CMD = join(process.cwd(), "src/flow.js");

describe("flow-state", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("saves and loads flow state", () => {
    tmp = createTmpDir();
    const state = { spec: "specs/001-test/spec.md", baseBranch: "main", featureBranch: "feature/001-test" };
    saveFlowState(tmp, state);
    const loaded = loadFlowState(tmp);
    assert.deepEqual(loaded, state);
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

  it("loads legacy flow state without worktree fields", () => {
    tmp = createTmpDir();
    const state = { spec: "specs/001-test/spec.md", baseBranch: "main", featureBranch: "feature/001-test" };
    saveFlowState(tmp, state);
    const loaded = loadFlowState(tmp);
    assert.deepEqual(loaded, state);
    assert.equal(loaded.worktree, undefined);
    assert.equal(loaded.worktreePath, undefined);
    assert.equal(loaded.mainRepoPath, undefined);
  });
});

describe("flow CLI", () => {
  it("exits with error when no request given", () => {
    try {
      execFileSync("node", [CMD], { encoding: "utf8" });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /--request is required/);
    }
  });

  it("shows help with --help", () => {
    const result = execFileSync("node", [CMD, "--help"], { encoding: "utf8" });
    assert.match(result, /--request/);
  });
});

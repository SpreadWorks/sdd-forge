import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
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

  it("handles gate failure with --spec without crashing", () => {
    const tmp = createTmpDir();
    try {
      execFileSync("git", ["init"], { cwd: tmp, stdio: "ignore" });
      execFileSync("git", ["checkout", "-b", "main"], { cwd: tmp, stdio: "ignore" });

      const specDir = join(tmp, "specs", "001-test");
      const specPath = join(specDir, "spec.md");
      fs.mkdirSync(specDir, { recursive: true });
      fs.writeFileSync(
        specPath,
        [
          "# Feature Specification: 001-test",
          "",
          "## Clarifications",
          "- Q:",
          "  - A:",
          "",
          "## User Confirmation",
          "- [ ] User approved this spec",
          "",
          "## Open Questions",
          "- [ ]",
        ].join("\n"),
      );

      try {
        execFileSync(
          "node",
          [CMD, "--request", "fix", "--spec", "specs/001-test/spec.md"],
          {
            encoding: "utf8",
            env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
          },
        );
        assert.fail("should exit non-zero");
      } catch (err) {
        assert.equal(err.status, 2);
        const out = `${err.stdout || ""}\n${err.stderr || ""}`;
        assert.match(out, /NEEDS_INPUT|追加入力が必要/);
        assert.doesNotMatch(out, /ReferenceError/);
      }
    } finally {
      removeTmpDir(tmp);
    }
  });
});

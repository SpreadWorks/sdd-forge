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

describe("flow merge --dry-run", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("shows squash merge commands for branch mode", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState());
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /git checkout main/);
    assert.match(result, /git merge --squash feature\/001-test/);
  });

  it("shows squash merge commands for worktree mode", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState({
      worktree: true,
      worktreePath: "/tmp/wt-test",
      mainRepoPath: "/tmp/main-repo",
    }));
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /git -C \/tmp\/main-repo merge --squash/);
  });

  it("shows skip message for spec-only mode", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState({
      featureBranch: "main",
      baseBranch: "main",
    }));
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /skip/i);
  });

  it("errors when no flow.json exists", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow/i);
    }
  });

  it("shows archive command for flow.json", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState());
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    // merge should reference the spec directory
    assert.match(result, /001-test/);
  });

  it("includes commit message hint", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState());
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /commit/i);
  });
});

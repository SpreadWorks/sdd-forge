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

describe("flow cleanup --dry-run", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("shows branch delete for branch mode", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState());
    const result = execFileSync("node", [FLOW_CMD, "cleanup", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /git branch -D feature\/001-test/);
  });

  it("shows worktree remove + branch delete for worktree mode", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState({
      worktree: true,
      worktreePath: "/tmp/wt-test",
      mainRepoPath: "/tmp/main-repo",
    }));
    const result = execFileSync("node", [FLOW_CMD, "cleanup", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /git -C \/tmp\/main-repo worktree remove/);
    assert.match(result, /git -C \/tmp\/main-repo branch -D/);
  });

  it("shows skip message for spec-only mode", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState({
      featureBranch: "main",
      baseBranch: "main",
    }));
    const result = execFileSync("node", [FLOW_CMD, "cleanup", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /skip/i);
  });

  it("errors when no flow.json exists", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "cleanup", "--dry-run"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow/i);
    }
  });

  it("includes branch name in cleanup output", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState());
    const result = execFileSync("node", [FLOW_CMD, "cleanup", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /feature\/001-test/);
  });

  it("preserves different branch name format", () => {
    tmp = createTmpDir();
    saveFlowState(tmp, makeState({
      featureBranch: "feature/042-custom-scan",
      baseBranch: "develop",
    }));
    const result = execFileSync("node", [FLOW_CMD, "cleanup", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /feature\/042-custom-scan/);
  });
});

describe("flow dispatcher routing", () => {
  it("routes 'merge' subcommand", () => {
    const tmp = createTmpDir();
    try {
      // Without flow.json, should error but prove routing works
      execFileSync("node", [FLOW_CMD, "merge"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow/i);
    } finally {
      removeTmpDir(tmp);
    }
  });

  it("routes 'cleanup' subcommand", () => {
    const tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "cleanup"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow/i);
    } finally {
      removeTmpDir(tmp);
    }
  });
});

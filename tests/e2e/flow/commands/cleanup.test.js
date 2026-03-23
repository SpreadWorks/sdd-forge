import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";
import { setupFlow } from "../../../helpers/flow-setup.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow cleanup --dry-run", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("shows branch delete for branch mode", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    const result = execFileSync("node", [FLOW_CMD, "cleanup", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /git branch -D feature\/001-test/);
  });

  it("shows worktree remove or skip + branch delete for worktree mode", () => {
    tmp = createTmpDir();
    setupFlow(tmp, { worktree: true });
    const result = execFileSync("node", [FLOW_CMD, "cleanup", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    // Worktree dir does not exist in test → graceful skip
    assert.match(result, /worktree/i);
    assert.match(result, /git -C .+ branch -D feature\/001-test/);
  });

  it("shows skip message for spec-only mode", () => {
    tmp = createTmpDir();
    setupFlow(tmp, {
      featureBranch: "main",
      baseBranch: "main",
    });
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
    setupFlow(tmp);
    const result = execFileSync("node", [FLOW_CMD, "cleanup", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /feature\/001-test/);
  });

  it("preserves different branch name format", () => {
    tmp = createTmpDir();
    setupFlow(tmp, {
      spec: "specs/042-custom-scan/spec.md",
      featureBranch: "feature/042-custom-scan",
      baseBranch: "develop",
    });
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

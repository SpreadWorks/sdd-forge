import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";
import { setupFlow } from "../../../helpers/flow-setup.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow merge --dry-run", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("shows squash merge commands for branch mode", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /git checkout main/);
    assert.match(result, /git merge --squash feature\/001-test/);
  });

  it("shows squash merge commands for worktree mode", () => {
    tmp = createTmpDir();
    setupFlow(tmp, { worktree: true });
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /git -C .+ merge --squash feature\/001-test/);
  });

  it("shows skip message for spec-only mode", () => {
    tmp = createTmpDir();
    setupFlow(tmp, {
      featureBranch: "main",
      baseBranch: "main",
    });
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
    setupFlow(tmp);
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /001-test/);
  });

  it("includes commit message hint", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /commit/i);
  });
});

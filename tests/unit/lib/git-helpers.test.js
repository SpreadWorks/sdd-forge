/**
 * Tests for runGit (spec 176-refactor-runcmd-git-logging).
 *
 * Verifies:
 *   R1  業務 git 操作のロギング (cmd, exitCode, stderr)
 *   R2  worktree 内で再帰なくログ記録
 *   R4  失敗時の exitCode/stderr 記録
 *   R5  失敗時に ok:false かつ status 非 0
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { runGit } from "../../../src/lib/git-helpers.js";
import { runCmd } from "../../../src/lib/process.js";
import { Logger } from "../../../src/lib/log.js";
import { todayLocal, readJsonl } from "../../helpers/log-fixtures.js";

function initRepo(dir) {
  runCmd("git", ["init", "-q", "-b", "main", dir]);
  runCmd("git", ["-C", dir, "config", "user.email", "test@example.com"]);
  runCmd("git", ["-C", dir, "config", "user.name", "Test"]);
  fs.writeFileSync(path.join(dir, "README.md"), "init\n");
  runCmd("git", ["-C", dir, "add", "."]);
  runCmd("git", ["-C", dir, "commit", "-q", "-m", "init"]);
}

describe("runGit — basic logging", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rungit-"));
    initRepo(tmpDir);
    Logger._resetForTest();
    Logger.getInstance().init(tmpDir, { logs: { enabled: true, dir: path.join(tmpDir, "logs") } });
  });

  afterEach(async () => {
    await Logger.getInstance().flush();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("R1: returns runCmd-compatible result on success and writes a git log record", async () => {
    const result = runGit(["status", "--short"], { cwd: tmpDir });
    assert.equal(result.ok, true);
    assert.equal(result.status, 0);
    assert.equal(typeof result.stdout, "string");
    assert.equal(typeof result.stderr, "string");

    await Logger.getInstance().flush();
    const jsonl = path.join(tmpDir, "logs", `sdd-forge-${todayLocal()}.jsonl`);
    const lines = readJsonl(jsonl);
    const gitLines = lines.filter((l) => l.type === "git");
    assert.equal(gitLines.length, 1);
    assert.deepEqual(gitLines[0].cmd, ["git", "status", "--short"]);
    assert.equal(gitLines[0].exitCode, 0);
    assert.equal(gitLines[0].stderr, "");
  });

  it("R4, R5: failure produces ok:false with non-zero status and is logged with stderr", async () => {
    const result = runGit(["this-is-not-a-real-subcommand"], { cwd: tmpDir });
    assert.equal(result.ok, false);
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.length > 0, "stderr should be captured");

    await Logger.getInstance().flush();
    const jsonl = path.join(tmpDir, "logs", `sdd-forge-${todayLocal()}.jsonl`);
    const lines = readJsonl(jsonl);
    const gitLines = lines.filter((l) => l.type === "git");
    assert.equal(gitLines.length, 1);
    assert.notEqual(gitLines[0].exitCode, 0);
    assert.ok(String(gitLines[0].stderr).length > 0);
  });
});

describe("runGit — worktree recursion regression (R2)", () => {
  let mainDir;
  let worktreeDir;

  beforeEach(() => {
    mainDir = fs.mkdtempSync(path.join(os.tmpdir(), "rungit-main-"));
    initRepo(mainDir);
    worktreeDir = path.join(os.tmpdir(), `rungit-wt-${Date.now()}`);
    const r = runCmd("git", ["-C", mainDir, "worktree", "add", "-b", "feature-x", worktreeDir]);
    if (!r.ok) throw new Error("worktree add failed: " + r.stderr);

    Logger._resetForTest();
    // Use logs.dir override so the recursion path through resolveLogDir/getMainRepoPath is exercised
    // only if the implementation chooses to; either way runGit must not blow up inside a worktree.
    Logger.getInstance().init(worktreeDir, { logs: { enabled: true } });
  });

  afterEach(async () => {
    await Logger.getInstance().flush();
    runCmd("git", ["-C", mainDir, "worktree", "remove", "--force", worktreeDir]);
    fs.rmSync(mainDir, { recursive: true, force: true });
    fs.rmSync(worktreeDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("does not recurse when called inside a worktree", async () => {
    // If recursion is reintroduced, this call will exhaust the stack.
    const result = runGit(["status", "--short"], { cwd: worktreeDir });
    assert.equal(result.ok, true);
    await Logger.getInstance().flush();
    // A log file must have been created on the main repo side (worktree-aware log dir resolution).
    const mainLogDir = path.join(mainDir, ".tmp", "logs");
    const jsonl = path.join(mainLogDir, `sdd-forge-${todayLocal()}.jsonl`);
    assert.ok(fs.existsSync(jsonl), `expected log file at ${jsonl}`);
    const lines = readJsonl(jsonl);
    const gitLines = lines.filter((l) => l.type === "git");
    assert.ok(gitLines.length >= 1);
  });
});

describe("runCmd no longer logs git commands", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rungit-rc-"));
    initRepo(tmpDir);
    Logger._resetForTest();
    Logger.getInstance().init(tmpDir, { logs: { enabled: true, dir: path.join(tmpDir, "logs") } });
  });

  afterEach(async () => {
    await Logger.getInstance().flush();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("R3: runCmd('git', ...) does NOT emit a git log record (use runGit instead)", async () => {
    const result = runCmd("git", ["status", "--short"], { cwd: tmpDir });
    assert.equal(result.ok, true);
    await Logger.getInstance().flush();
    const jsonl = path.join(tmpDir, "logs", `sdd-forge-${todayLocal()}.jsonl`);
    if (fs.existsSync(jsonl)) {
      const lines = readJsonl(jsonl);
      const gitLines = lines.filter((l) => l.type === "git");
      assert.equal(gitLines.length, 0, "runCmd should not log git records (only runGit does)");
    }
  });
});

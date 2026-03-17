import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/spec/commands/init.js");

describe("spec init CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("creates spec files in dry-run mode", () => {
    tmp = createTmpDir();
    // Init a git repo for the command
    execFileSync("git", ["init", tmp], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "checkout", "-b", "main"], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { encoding: "utf8" });

    const result = execFileSync("node", [CMD, "--title", "test-feature", "--base", "main", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.match(result, /dry-run/);
    assert.match(result, /001-test-feature/);
  });

  it("throws when no title given", () => {
    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: "/tmp" },
      });
      assert.fail("should throw");
    } catch (err) {
      assert.match(err.stderr, /--title is required/);
    }
  });

  it("creates spec files and branch", () => {
    tmp = createTmpDir();
    execFileSync("git", ["init", tmp], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "checkout", "-b", "main"], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { encoding: "utf8" });

    const result = execFileSync("node", [CMD, "--title", "my-feat", "--base", "main", "--allow-dirty"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.match(result, /created branch/);
    assert.match(result, /created spec/);
    assert.ok(fs.existsSync(join(tmp, "specs/001-my-feat/spec.md")));
    assert.ok(fs.existsSync(join(tmp, "specs/001-my-feat/qa.md")));
  });

  it("shows help with --help", () => {
    const result = execFileSync("node", [CMD, "--help"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: "/tmp" },
    });
    assert.match(result, /--title/);
    assert.match(result, /--no-branch/);
    assert.match(result, /--worktree/);
  });

  it("creates spec without branch using --no-branch", () => {
    tmp = createTmpDir();
    execFileSync("git", ["init", tmp], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "checkout", "-b", "main"], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { encoding: "utf8" });

    const result = execFileSync("node", [CMD, "--title", "nb-feat", "--base", "main", "--no-branch", "--allow-dirty"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    // Should create spec but NOT branch
    assert.match(result, /created spec/);
    assert.ok(!result.includes("created branch"));
    assert.ok(fs.existsSync(join(tmp, "specs/001-nb-feat/spec.md")));
    assert.ok(fs.existsSync(join(tmp, "specs/001-nb-feat/qa.md")));

    // Should still be on main
    const branch = execFileSync("git", ["-C", tmp, "rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim();
    assert.equal(branch, "main");
  });

  it("shows mode: spec-only in --no-branch --dry-run", () => {
    tmp = createTmpDir();
    execFileSync("git", ["init", tmp], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "checkout", "-b", "main"], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { encoding: "utf8" });

    const result = execFileSync("node", [CMD, "--title", "test-so", "--base", "main", "--no-branch", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.match(result, /mode: spec-only/);
  });

  it("creates worktree with --worktree", () => {
    tmp = createTmpDir();
    execFileSync("git", ["init", tmp], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "checkout", "-b", "main"], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { encoding: "utf8" });

    const result = execFileSync("node", [CMD, "--title", "wt-feat", "--base", "main", "--worktree", "--allow-dirty"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.match(result, /created worktree/);
    assert.match(result, /created branch/);
    const wtPath = join(tmp, ".sdd-forge", "worktree", "feature-001-wt-feat");
    assert.ok(fs.existsSync(join(wtPath, "specs/001-wt-feat/spec.md")));
    assert.ok(fs.existsSync(join(wtPath, "specs/001-wt-feat/qa.md")));

    // Cleanup worktree
    execFileSync("git", ["-C", tmp, "worktree", "remove", "--force", wtPath], { encoding: "utf8" });
  });

  it("shows mode: worktree in --worktree --dry-run", () => {
    tmp = createTmpDir();
    execFileSync("git", ["init", tmp], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "checkout", "-b", "main"], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { encoding: "utf8" });

    const result = execFileSync("node", [CMD, "--title", "test-wt", "--base", "main", "--worktree", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.match(result, /mode: worktree/);
    assert.match(result, /worktree:/);
  });

  it("auto-detects worktree and skips branch creation", () => {
    tmp = createTmpDir();
    execFileSync("git", ["init", tmp], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "checkout", "-b", "main"], { encoding: "utf8" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { encoding: "utf8" });

    const wtPath = join(tmp, "auto-wt");
    execFileSync("git", ["-C", tmp, "worktree", "add", wtPath, "-b", "wt-auto"], { encoding: "utf8" });

    const result = execFileSync("node", [CMD, "--title", "auto-feat", "--base", "main", "--allow-dirty"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: wtPath },
    });

    // Should detect worktree and create spec-only (no branch)
    assert.ok(!result.includes("created branch"));
    assert.match(result, /created spec/);
    assert.ok(fs.existsSync(join(wtPath, "specs/001-auto-feat/spec.md")));

    // Cleanup worktree
    execFileSync("git", ["-C", tmp, "worktree", "remove", "--force", wtPath], { encoding: "utf8" });
  });
});

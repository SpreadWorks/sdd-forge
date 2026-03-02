import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/specs/commands/init.js");

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
  });
});

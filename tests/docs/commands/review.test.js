import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/review.js");

describe("review CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("passes with valid chapter files", () => {
    tmp = createTmpDir();
    // Create a chapter with >15 lines and an H1
    const lines = ["# 01. Introduction", ""];
    for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
    writeFile(tmp, "docs/01_intro.md", lines.join("\n"));

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /PASSED/);
  });

  it("fails when no chapter files found", () => {
    tmp = createTmpDir();
    writeFile(tmp, "docs/.gitkeep", "");

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should have exited non-zero");
    } catch (err) {
      assert.match(err.stderr, /no chapter files found/);
    }
  });

  it("fails when chapter is too short", () => {
    tmp = createTmpDir();
    writeFile(tmp, "docs/01_short.md", "# 01. Short\nOnly two lines\n");

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should have exited non-zero");
    } catch (err) {
      assert.match(err.stdout, /too short/);
    }
  });

  it("fails when chapter has no H1 heading", () => {
    tmp = createTmpDir();
    const lines = ["No heading here", ""];
    for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
    writeFile(tmp, "docs/01_noheading.md", lines.join("\n"));

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should have exited non-zero");
    } catch (err) {
      assert.match(err.stdout, /missing H1/);
    }
  });

  it("fails when {{data}} directive is unfilled", () => {
    tmp = createTmpDir();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 10; i++) lines.push(`Line ${i}`);
    lines.push('<!-- {{data: controllers.list("Name|Actions")}} -->');
    lines.push(""); // empty line = unfilled
    for (let i = 0; i < 5; i++) lines.push(`More ${i}`);
    writeFile(tmp, "docs/01_test.md", lines.join("\n"));

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should have exited non-zero");
    } catch (err) {
      assert.match(err.stdout, /unfilled \{\{data\}\}/);
    }
  });


  it("warns when analysis.json is missing", () => {
    tmp = createTmpDir();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
    writeFile(tmp, "docs/01_test.md", lines.join("\n"));

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /analysis\.json not found/);
  });
});

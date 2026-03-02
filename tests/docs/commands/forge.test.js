import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/forge.js");

describe("forge CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("exits with error when no prompt given", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /prompt is required/);
    }
  });

  it("shows help with --help", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });

    const result = execFileSync("node", [CMD, "--help"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /--prompt/);
  });

  it("runs review in local mode and handles pass", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });
    // Create docs that will pass review
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 20; i++) lines.push(`Content line ${i}`);
    writeFile(tmp, "docs/01_test.md", lines.join("\n"));

    // Use a review command that always passes
    const result = execFileSync("node", [
      CMD,
      "--prompt", "test",
      "--review-cmd", "echo review-passed",
      "--max-runs", "1",
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /DONE/);
  });
});

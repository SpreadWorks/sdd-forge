import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync, spawnSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/setup.js");

describe("setup CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("shows help with --help", () => {
    tmp = createTmpDir();
    const result = execFileSync("node", [CMD, "--help"], {
      encoding: "utf8",
      cwd: tmp,
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /setup/i);
  });

  it("runs interactive setup and prompts for input", () => {
    tmp = createTmpDir();
    writeJson(tmp, "package.json", { name: "test-proj" });

    // Send empty input to trigger interactive prompt; it should ask for language
    const result = spawnSync("node", [CMD], {
      encoding: "utf8",
      cwd: tmp,
      input: "\n",
      timeout: 5000,
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    // Should prompt for UI language selection
    const output = result.stdout + result.stderr;
    assert.match(output, /Setup|language|lang/i);
  });
});

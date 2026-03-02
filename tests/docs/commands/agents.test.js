import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/agents.js");

describe("agents CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("generates PROJECT section in template mode", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      files: { summary: { total: 5 } },
    });
    writeJson(tmp, "package.json", { name: "test", scripts: { test: "echo test" } });
    // Create AGENTS.md with SDD section
    writeFile(tmp, "AGENTS.md", [
      "<!-- SDD:START -->",
      "SDD content",
      "<!-- SDD:END -->",
      "",
      "<!-- PROJECT:START -->",
      "old project content",
      "<!-- PROJECT:END -->",
    ].join("\n"));

    execFileSync("node", [CMD, "--template"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const content = fs.readFileSync(join(tmp, "AGENTS.md"), "utf8");
    assert.match(content, /PROJECT:START/);
    assert.match(content, /Project Context/);
  });

  it("exits non-zero when analysis.json is missing", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli" });

    try {
      execFileSync("node", [CMD, "--template"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /analysis\.json/);
    }
  });
});

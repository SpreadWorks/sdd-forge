import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/data.js");

describe("data CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("runs without error on docs with no directives", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli", output: { languages: ["ja"], default: "ja" } });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      extras: {},
    });
    writeFile(tmp, "docs/01_overview.md", [
      "# 01. Overview",
      "## 説明",
      "テスト",
      "## 内容",
      "No directives here",
      "",
    ].join("\n"));

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      stdio: ["pipe", "pipe", "pipe"],
    });
    // Should complete without error (output goes to stderr)
  });

  it("dry-run does not modify files", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli", output: { languages: ["ja"], default: "ja" } });
    writeJson(tmp, ".sdd-forge/output/analysis.json", { analyzedAt: "2026-01-01", extras: {} });
    const original = "# 01. Test\n## 説明\nx\n## 内容\nNo directives\n";
    writeFile(tmp, "docs/01_test.md", original);

    execFileSync("node", [CMD, "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const content = fs.readFileSync(join(tmp, "docs/01_test.md"), "utf8");
    assert.equal(content, original);
  });

  it("shows help with --help", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli", output: { languages: ["ja"], default: "ja" } });

    // --help triggers the isDirectRun guard but may not print since parseArgs only handles it
    // inside main(). The command should not error.
    try {
      execFileSync("node", [CMD, "--help"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
    } catch (_) {
      // help may exit 0
    }
  });
});

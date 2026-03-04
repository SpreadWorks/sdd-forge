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

  it("--sdd updates only SDD section", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja" });
    writeFile(tmp, "AGENTS.md", [
      "<!-- SDD:START -->",
      "old SDD content",
      "<!-- SDD:END -->",
      "",
      "<!-- PROJECT:START -->",
      "existing project content",
      "<!-- PROJECT:END -->",
      "",
      "## Project Guidelines",
      "",
      "custom guidelines",
    ].join("\n"));

    execFileSync("node", [CMD, "--sdd"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const content = fs.readFileSync(join(tmp, "AGENTS.md"), "utf8");
    // SDD section should be replaced with template
    assert.match(content, /SDD:START/);
    // PROJECT section should remain unchanged
    assert.match(content, /existing project content/);
    // Guidelines should remain unchanged
    assert.match(content, /custom guidelines/);
  });

  it("--sdd --dry-run outputs to stdout without writing", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja" });
    const originalContent = [
      "<!-- SDD:START -->",
      "old SDD",
      "<!-- SDD:END -->",
    ].join("\n");
    writeFile(tmp, "AGENTS.md", originalContent);

    const result = execFileSync("node", [CMD, "--sdd", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    // stdout should contain SDD template content
    assert.match(result, /SDD:START/);
    // File should remain unchanged
    const content = fs.readFileSync(join(tmp, "AGENTS.md"), "utf8");
    assert.strictEqual(content, originalContent);
  });

  it("--project exits non-zero when analysis.json is missing", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli" });
    writeFile(tmp, "AGENTS.md", "<!-- SDD:START -->\n<!-- SDD:END -->\n");

    try {
      execFileSync("node", [CMD, "--project"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /analysis\.json/);
    }
  });

  it("--project exits non-zero when no agent configured", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli" });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      files: { summary: { total: 5 } },
    });
    writeFile(tmp, "AGENTS.md", "<!-- SDD:START -->\n<!-- SDD:END -->\n");

    try {
      execFileSync("node", [CMD, "--project"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /default agent/i);
    }
  });

  it("default (no flags) updates SDD section and requires agent for PROJECT", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli" });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      files: { summary: { total: 5 } },
    });
    writeFile(tmp, "AGENTS.md", [
      "<!-- SDD:START -->",
      "old SDD",
      "<!-- SDD:END -->",
      "",
      "<!-- PROJECT:START -->",
      "old project",
      "<!-- PROJECT:END -->",
    ].join("\n"));

    // Without agent configured, default mode should update SDD but fail on PROJECT
    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.fail("should exit non-zero (no agent)");
    } catch (err) {
      assert.match(err.stderr, /default agent/i);
    }

    // SDD section should have been updated before the PROJECT error
    const content = fs.readFileSync(join(tmp, "AGENTS.md"), "utf8");
    assert.match(content, /SDD:START/);
    // SDD should have been replaced (not "old SDD" anymore)
    assert.ok(!content.includes("old SDD"));
  });
});

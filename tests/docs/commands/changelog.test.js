import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/changelog.js");

describe("changelog CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("generates changelog from specs", () => {
    tmp = createTmpDir();
    const specContent = [
      "# Feature Specification: 001-test-feature",
      "",
      "**Feature Branch**: `feature/001-test-feature`",
      "**Created**: 2026-01-01",
      "**Status**: Draft",
      "**Input**: User request",
      "",
      "## Scope",
      "- Add tests",
    ].join("\n");
    writeFile(tmp, "specs/001-test-feature/spec.md", specContent);
    fs.mkdirSync(join(tmp, "docs"), { recursive: true });

    execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const outFile = join(tmp, "docs", "change_log.md");
    assert.ok(fs.existsSync(outFile), "change_log.md should be created");
    const content = fs.readFileSync(outFile, "utf8");
    assert.match(content, /Change Log/);
    assert.match(content, /001-test-feature/);
    assert.match(content, /Draft/);
  });

  it("generates empty changelog when no specs exist", () => {
    tmp = createTmpDir();
    fs.mkdirSync(join(tmp, "docs"), { recursive: true });

    execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const outFile = join(tmp, "docs", "change_log.md");
    assert.ok(fs.existsSync(outFile));
    const content = fs.readFileSync(outFile, "utf8");
    assert.match(content, /Change Log/);
  });

  it("--dry-run outputs to stdout without writing file", () => {
    tmp = createTmpDir();
    const specContent = [
      "# Feature Specification: 001-test-feature",
      "",
      "**Feature Branch**: `feature/001-test-feature`",
      "**Created**: 2026-01-01",
      "**Status**: Draft",
      "**Input**: User request",
    ].join("\n");
    writeFile(tmp, "specs/001-test-feature/spec.md", specContent);
    fs.mkdirSync(join(tmp, "docs"), { recursive: true });

    const result = execFileSync("node", [CMD, "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /Change Log/);
    assert.match(result, /001-test-feature/);
    // File should NOT be written
    const outFile = join(tmp, "docs", "change_log.md");
    assert.ok(!fs.existsSync(outFile), "change_log.md should NOT be created in dry-run");
  });

  it("preserves MANUAL block from existing file", () => {
    tmp = createTmpDir();
    fs.mkdirSync(join(tmp, "docs"), { recursive: true });
    const outFile = join(tmp, "docs", "change_log.md");
    const existing = [
      "<!-- AUTO-GEN:START -->",
      "old content",
      "<!-- AUTO-GEN:END -->",
      "",
      "<!-- MANUAL:START -->",
      "My custom notes",
      "<!-- MANUAL:END -->",
    ].join("\n");
    fs.writeFileSync(outFile, existing);

    execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const content = fs.readFileSync(outFile, "utf8");
    assert.match(content, /My custom notes/);
  });
});
